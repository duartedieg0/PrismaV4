import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { apiSuccess, apiError } from "@/services/errors/api-response";
import { getConsultantBackend } from "@/features/support/consultant-backend";
import { mastraCreateThread } from "@/features/support/thread-handlers-mastra";

export const POST = withTeacherRoute(async (ctx, req) => {
  if (getConsultantBackend() === "managed") {
    // Implementado na Task 4
    return new Response("Managed backend não implementado ainda", { status: 501 });
  }
  return mastraCreateThread(ctx, req);
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
