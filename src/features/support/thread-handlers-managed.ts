import { z } from "zod";
import { after } from "next/server";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import type Anthropic from "@anthropic-ai/sdk";
import { isValidAgentSlug } from "@/domains/support/contracts";
import { generateThreadTitle } from "@/features/support/thread-title";
import { createMastraModel } from "@/mastra/providers/provider-factory";
import type { AiModelRecord } from "@/mastra/providers/model-registry";
import {
  apiSuccess,
  apiValidationError,
  apiError,
  apiNotFound,
} from "@/services/errors/api-response";
import type { TeacherContext } from "@/features/support/with-teacher-route";
import type { TeaConsultantGateway, ManagedEvent } from "@/gateways/managed-agents";
import { syncSessionUsage } from "@/gateways/managed-agents";
import { logError } from "@/services/observability/logger";
import { createRequestContext } from "@/services/runtime/request-context";

const createThreadSchema = z.object({
  agentSlug: z.string().min(1),
});

/**
 * Consome um AsyncIterable de ManagedEvent e acumula o texto das respostas do agente.
 * Ignora eventos agent.tool_use. Para no session.status_idle.
 *
 * NOTE: Esta função existe para testes unitários da lógica de filtragem.
 * O managedStreamMessage implementa a mesma lógica inline porque precisa interlear
 * writer.write() com cada evento — consumir o AsyncIterable duas vezes não é possível.
 */
export async function consumeManagedStreamToText(
  stream: AsyncIterable<ManagedEvent>,
): Promise<{ text: string }> {
  let text = "";

  for await (const event of stream) {
    if (event.type === "agent.message") {
      const blocks = (event.content as Array<{ type: string; text?: string }>) ?? [];
      for (const block of blocks) {
        if (block.type === "text" && block.text) {
          text += block.text;
        }
      }
    }
    if (event.type === "session.status_idle") break;
  }

  return { text };
}

export async function managedCreateThread(
  ctx: TeacherContext,
  req: Request,
  gateway: TeaConsultantGateway,
): Promise<Response> {
  const body = await req.json();
  const parsed = createThreadSchema.safeParse(body);

  if (!parsed.success) return apiValidationError(parsed.error);
  if (!isValidAgentSlug(parsed.data.agentSlug)) {
    return apiError("VALIDATION_ERROR", "Agente não encontrado.", 400);
  }

  let session;
  try {
    session = await gateway.createSession();
  } catch {
    return apiError("INTERNAL_ERROR", "Erro ao criar sessão no Managed Agents.", 500);
  }

  const { data, error } = await ctx.supabase
    .from("consultant_threads")
    .insert({
      teacher_id: ctx.userId,
      agent_slug: parsed.data.agentSlug,
      managed_session_id: session.id,
    })
    .select("id")
    .single();

  if (error) return apiError("INTERNAL_ERROR", "Erro ao criar conversa.", 500);
  return apiSuccess({ threadId: data.id }, 201);
}

export async function managedGetMessages(
  ctx: TeacherContext,
  req: Request,
  gateway: TeaConsultantGateway,
): Promise<Response> {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const threadId = segments[segments.indexOf("threads") + 1];

  const { data: thread, error: threadError } = await ctx.supabase
    .from("consultant_threads")
    .select("id, managed_session_id")
    .eq("id", threadId)
    .single();

  if (threadError || !thread) return apiNotFound("Conversa não encontrada.");

  const sessionId = (thread as Record<string, unknown>).managed_session_id as string | null;
  if (!sessionId) return apiSuccess({ messages: [] });

  try {
    const messages = await gateway.getSessionMessages(sessionId);
    return apiSuccess({ messages });
  } catch {
    return apiSuccess({ messages: [] });
  }
}

const useChatSchema = z.object({
  messages: z
    .array(
      z
        .object({
          role: z.string(),
          parts: z
            .array(
              z.object({ type: z.string(), text: z.string().optional() }).passthrough(),
            )
            .optional(),
          content: z.string().optional(),
        })
        .passthrough(),
    )
    .min(1),
});

export async function managedStreamMessage(
  ctx: TeacherContext,
  req: Request,
  gateway: TeaConsultantGateway,
  anthropic: Anthropic,
): Promise<Response> {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const threadId = segments[segments.indexOf("threads") + 1];

  // 1. Validar input
  const body = await req.json();
  const parsed = useChatSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

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

  // 2. Buscar thread (incluindo managed_session_id e title)
  const { data: thread, error: threadError } = await ctx.supabase
    .from("consultant_threads")
    .select("id, agent_slug, title, managed_session_id")
    .eq("id", threadId)
    .single();

  if (threadError || !thread) return apiNotFound("Conversa não encontrada.");

  const managedSessionId = (thread as Record<string, unknown>).managed_session_id as string | null;
  if (!managedSessionId) {
    return apiError("INTERNAL_ERROR", "Thread não está associada a uma sessão Managed.", 500);
  }

  // 3. Buscar modelo da tabela ai_models (para generateThreadTitle no after())
  const { data: rawModels } = await ctx.supabase
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
  const modelRecord = models.find((m) => m.isDefault) ?? models[0];
  const model = createMastraModel(modelRecord);

  // 4. Stream via Managed Agents
  const managedStream = await gateway.sendMessageAndStream(managedSessionId, userContent);
  let fullResponse = "";

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({ type: "start" });
      writer.write({ type: "text-start", id: "text-0" });

      try {
        for await (const event of managedStream) {
          if (event.type === "agent.message") {
            const blocks = (event.content as Array<{ type: string; text?: string }>) ?? [];
            for (const block of blocks) {
              if (block.type === "text" && block.text) {
                writer.write({ type: "text-delta", id: "text-0", delta: block.text });
                fullResponse += block.text;
              }
            }
          }
          if (event.type === "session.status_idle") break;
        }
      } catch {
        writer.write({
          type: "text-delta",
          id: "text-0",
          delta: "\n\n*Erro ao processar resposta.*",
        });
      }

      writer.write({ type: "text-end", id: "text-0" });
      writer.write({ type: "finish" });
    },
  });

  // 5. Background: gerar título na primeira mensagem + atualizar updated_at
  const threadTitle = (thread as Record<string, unknown>).title as string | null;
  // after() fires after the response body is fully sent, at which point
  // the execute() callback above has completed and fullResponse is fully populated.
  after(async () => {
    try {
      if (!threadTitle) {
        const title = await generateThreadTitle(model, userContent, fullResponse);
        await ctx.supabase
          .from("consultant_threads")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", threadId);
      } else {
        await ctx.supabase
          .from("consultant_threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", threadId);
      }
    } catch {
      if (!threadTitle) {
        // generateThreadTitle failed — use truncated user message as fallback title
        const title =
          userContent.length <= 80 ? userContent : userContent.slice(0, 77) + "...";
        await ctx.supabase
          .from("consultant_threads")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", threadId);
      }
      // If thread already had a title, silently swallow the updated_at error
    }

    // Sincronizar usage em background — erro é logado e swallowed
    try {
      await syncSessionUsage(anthropic, ctx.supabase, threadId, managedSessionId);
    } catch (error) {
      logError("Erro ao sincronizar usage da sessão", createRequestContext(), error);
    }
  });

  return createUIMessageStreamResponse({ stream });
}
