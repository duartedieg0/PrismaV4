import { z } from "zod";
import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { isValidAgentSlug } from "@/domains/support/contracts";
import {
  apiSuccess,
  apiValidationError,
  apiError,
} from "@/services/errors/api-response";

const createThreadSchema = z.object({
  agentSlug: z.string().min(1),
});

export const POST = withTeacherRoute(async ({ supabase, userId }, request) => {
  const body = await request.json();
  const parsed = createThreadSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  if (!isValidAgentSlug(parsed.data.agentSlug)) {
    return apiError("VALIDATION_ERROR", "Agente não encontrado.", 400);
  }

  const { data, error } = await supabase
    .from("consultant_threads")
    .insert({
      teacher_id: userId,
      agent_slug: parsed.data.agentSlug,
    })
    .select("id")
    .single();

  if (error) {
    return apiError("INTERNAL_ERROR", "Erro ao criar conversa.", 500);
  }

  return apiSuccess({ threadId: data.id }, 201);
});

export const GET = withTeacherRoute(async ({ supabase, userId }, request) => {
  const url = new URL(request.url);
  const agentSlug = url.searchParams.get("agentSlug");
  const cursor = url.searchParams.get("cursor");
  const limit = 20;

  let query = supabase
    .from("consultant_threads")
    .select("id, agent_slug, title, created_at, updated_at")
    .eq("teacher_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit + 1);

  if (agentSlug) {
    query = query.eq("agent_slug", agentSlug);
  }

  if (cursor) {
    query = query.lt("updated_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    return apiError("INTERNAL_ERROR", "Erro ao listar conversas.", 500);
  }

  const hasMore = (data?.length ?? 0) > limit;
  const threads = data?.slice(0, limit) ?? [];
  const nextCursor = hasMore
    ? threads[threads.length - 1]?.updated_at
    : null;

  return apiSuccess({ threads, nextCursor });
});
