import { z } from "zod";
import { after } from "next/server";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
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

// Schema do payload enviado pelo useChat (DefaultChatTransport do AI SDK v6)
const useChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      parts: z.array(z.object({ type: z.string(), text: z.string().optional() }).passthrough()).optional(),
      content: z.string().optional(),
    }).passthrough(),
  ).min(1),
});

export const POST = withTeacherRoute(async ({ supabase, userId }, request) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const threadId = segments[segments.indexOf("threads") + 1];

  // Validar input — extrair última mensagem do formato useChat
  const body = await request.json();
  const parsed = useChatSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  // Extrair conteúdo da última mensagem do usuário
  const lastMessage = parsed.data.messages[parsed.data.messages.length - 1];
  const userContent =
    lastMessage.content ??
    lastMessage.parts
      ?.filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("") ??
    "";

  if (!userContent || userContent.length === 0 || userContent.length > 2000) {
    return apiError("VALIDATION_ERROR", "Mensagem inválida (vazia ou muito longa).", 400);
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

  // Stream da resposta via Mastra → UIMessageStream para useChat
  const result = await agent.stream(userContent, {
    memory: {
      thread: threadId,
      resource: userId,
    },
  });

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const textId = "text-0";
      writer.write({ type: "start" });
      writer.write({ type: "text-start", id: textId });

      const reader = result.textStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          writer.write({ type: "text-delta", id: textId, delta: value });
        }
      } finally {
        reader.releaseLock();
      }

      writer.write({ type: "text-end", id: textId });
      writer.write({ type: "finish" });
    },
  });

  // Gerar título após primeira mensagem + atualizar updated_at (em background)
  after(async () => {
    try {
      if (!thread.title) {
        const fullResponse = await result.text;
        const title = await generateThreadTitle(
          model,
          userContent,
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
        userContent.length <= 80
          ? userContent
          : userContent.slice(0, 77) + "...";
      await supabase
        .from("consultant_threads")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", threadId);
    }
  });

  return createUIMessageStreamResponse({ stream });
});
