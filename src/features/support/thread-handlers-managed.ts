import { z } from "zod";
import { isValidAgentSlug } from "@/domains/support/contracts";
import {
  apiSuccess,
  apiValidationError,
  apiError,
  apiNotFound,
} from "@/services/errors/api-response";
import type { TeacherContext } from "@/features/support/with-teacher-route";
import type { TeaConsultantGateway, ManagedEvent } from "@/gateways/managed-agents";

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

  try {
    const messages = await gateway.getSessionMessages(
      (thread as Record<string, unknown>).managed_session_id as string,
    );
    return apiSuccess({ messages });
  } catch {
    return apiSuccess({ messages: [] });
  }
}

// managedStreamMessage will be added in Task 7
