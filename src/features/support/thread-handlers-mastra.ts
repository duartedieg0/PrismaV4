import { z } from "zod";
import { after } from "next/server";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { LibSQLStore } from "@mastra/libsql";
import { createTeaConsultantAgent } from "@/mastra/agents/tea-consultant-agent";
import { generateThreadTitle } from "@/features/support/thread-title";
import { createMastraModel } from "@/mastra/providers/provider-factory";
import type { AiModelRecord } from "@/mastra/providers/model-registry";
import { isValidAgentSlug } from "@/domains/support/contracts";
import {
  apiSuccess,
  apiValidationError,
  apiError,
  apiNotFound,
} from "@/services/errors/api-response";
import type { TeacherContext } from "@/features/support/with-teacher-route";

const MASTRA_DB_URL = process.env.MASTRA_DB_URL ?? "http://127.0.0.1:8080";
const MASTRA_DB_TOKEN = process.env.MASTRA_DB_TOKEN ?? "";

const createThreadSchema = z.object({
  agentSlug: z.string().min(1),
});

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

export async function mastraCreateThread(
  ctx: TeacherContext,
  req: Request,
): Promise<Response> {
  const body = await req.json();
  const parsed = createThreadSchema.safeParse(body);

  if (!parsed.success) return apiValidationError(parsed.error);
  if (!isValidAgentSlug(parsed.data.agentSlug)) {
    return apiError("VALIDATION_ERROR", "Agente não encontrado.", 400);
  }

  const { data, error } = await ctx.supabase
    .from("consultant_threads")
    .insert({ teacher_id: ctx.userId, agent_slug: parsed.data.agentSlug })
    .select("id")
    .single();

  if (error) return apiError("INTERNAL_ERROR", "Erro ao criar conversa.", 500);
  return apiSuccess({ threadId: data.id }, 201);
}

export async function mastraStreamMessage(
  ctx: TeacherContext,
  req: Request,
): Promise<Response> {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const threadId = segments[segments.indexOf("threads") + 1];

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

  const { data: thread, error: threadError } = await ctx.supabase
    .from("consultant_threads")
    .select("id, agent_slug, title")
    .eq("id", threadId)
    .single();

  if (threadError || !thread) return apiNotFound("Conversa não encontrada.");

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
  const agent = createTeaConsultantAgent(model);

  const result = await agent.stream(userContent, {
    memory: { thread: threadId, resource: ctx.userId },
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

  after(async () => {
    try {
      if (!thread.title) {
        const fullResponse = await result.text;
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
      const title =
        userContent.length <= 80 ? userContent : userContent.slice(0, 77) + "...";
      await ctx.supabase
        .from("consultant_threads")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", threadId);
    }
  });

  return createUIMessageStreamResponse({ stream });
}

export async function mastraGetMessages(
  ctx: TeacherContext,
  req: Request,
): Promise<Response> {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const threadId = segments[segments.indexOf("threads") + 1];

  const { data: thread, error: threadError } = await ctx.supabase
    .from("consultant_threads")
    .select("id")
    .eq("id", threadId)
    .single();

  if (threadError || !thread) return apiNotFound("Conversa não encontrada.");

  try {
    const storage = new LibSQLStore({
      id: "tea-consultant-storage",
      url: MASTRA_DB_URL,
      authToken: MASTRA_DB_TOKEN || undefined,
    });

    const memoryStore = await storage.getStore("memory");
    if (!memoryStore) return apiSuccess({ messages: [] });

    const result = await memoryStore.listMessages({ threadId, resourceId: ctx.userId });

    const messages = result.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => {
        const textContent =
          m.content?.parts
            ?.filter((p: Record<string, unknown>) => p.type === "text" && p.text)
            .map((p: Record<string, unknown>) => p.text)
            .join("") ?? "";
        return { id: m.id, role: m.role, content: textContent, createdAt: m.createdAt };
      });

    return apiSuccess({ messages });
  } catch {
    return apiSuccess({ messages: [] });
  }
}
