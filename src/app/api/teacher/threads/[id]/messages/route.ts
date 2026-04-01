import { z } from "zod";
import { after } from "next/server";
import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { createTeaConsultantAgent } from "@/mastra/agents/tea-consultant-agent";
import { generateThreadTitle } from "@/features/support/thread-title";
import { createMastraModel } from "@/mastra/providers/provider-factory";
import type { AiModelRecord } from "@/mastra/providers/model-registry";
import {
  apiValidationError,
  apiNotFound,
  apiError,
} from "@/services/errors/api-response";

export const maxDuration = 60;

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const POST = withTeacherRoute(async ({ supabase, userId }, request) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const threadId = segments[segments.indexOf("threads") + 1];

  // Validar input
  const body = await request.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  // Verificar ownership da thread (RLS)
  const { data: thread, error: threadError } = await supabase
    .from("consultant_threads")
    .select("id, agent_slug, title")
    .eq("id", threadId)
    .single();

  if (threadError || !thread) {
    return apiNotFound("Conversa não encontrada.");
  }

  // Resolver modelo do agente (mapear snake_case do Supabase → camelCase)
  const { data: rawModels } = await supabase
    .from("ai_models")
    .select("*")
    .eq("enabled", true);

  if (!rawModels || rawModels.length === 0) {
    return apiError("INTERNAL_ERROR", "Nenhum modelo de IA configurado.", 500);
  }

  const models: AiModelRecord[] = rawModels.map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: m.name as string,
    provider: m.provider as string,
    modelId: m.model_id as string,
    baseUrl: m.base_url as string,
    apiKey: m.api_key as string,
    enabled: m.enabled as boolean,
    isDefault: m.is_default as boolean,
  }));

  // Usar modelo default ou primeiro habilitado
  const modelRecord = models.find((m) => m.isDefault) ?? models[0];
  const model = createMastraModel(modelRecord);

  // Criar agente
  const agent = createTeaConsultantAgent(model);

  // Stream da resposta
  const result = await agent.stream(parsed.data.content, {
    threadId,
    resourceId: userId,
  });

  // Gerar título após primeira mensagem + atualizar updated_at (em background)
  after(async () => {
    try {
      if (!thread.title) {
        const fullResponse = await result.text;
        const title = await generateThreadTitle(
          model,
          parsed.data.content,
          fullResponse,
        );
        await supabase
          .from("consultant_threads")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", threadId);
      } else {
        await supabase
          .from("consultant_threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", threadId);
      }
    } catch {
      // Fallback: usar mensagem do professor truncada
      const title =
        parsed.data.content.length <= 80
          ? parsed.data.content
          : parsed.data.content.slice(0, 77) + "...";
      await supabase
        .from("consultant_threads")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", threadId);
    }
  });

  return result.toDataStreamResponse();
});
