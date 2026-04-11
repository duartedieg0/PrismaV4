import { withAdminRoute } from "@/app/api/admin/with-admin-route";
import { apiSuccess, apiInternalError, apiNotFound } from "@/services/errors/api-response";
import type { AdminUsageThread } from "@/features/admin/usage/contracts";

export const GET = withAdminRoute(async ({ supabase }, request) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const userId = segments[segments.indexOf("usage") + 1];

  if (!userId) return apiNotFound("Usuário não encontrado.");

  const [profileResult, threadsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single(),
    supabase
      .from("consultant_threads")
      .select(
        "id, title, total_input_tokens, total_output_tokens, total_cache_read_tokens, total_cache_creation_tokens, estimated_cost_usd, updated_at",
      )
      .eq("teacher_id", userId)
      .not("managed_session_id", "is", null)
      .order("updated_at", { ascending: false }),
  ]);

  if (profileResult.error) return apiInternalError(profileResult.error.message);
  if (!profileResult.data) return apiNotFound("Usuário não encontrado.");

  const profile = profileResult.data as { full_name: string | null; email: string | null };
  const rawThreads = threadsResult.data ?? [];

  const threads: AdminUsageThread[] = rawThreads.map((t) => ({
    threadId: t.id as string,
    title: t.title as string | null,
    inputTokens: (t.total_input_tokens as number) ?? 0,
    outputTokens: (t.total_output_tokens as number) ?? 0,
    cacheReadTokens: (t.total_cache_read_tokens as number) ?? 0,
    cacheCreationTokens: (t.total_cache_creation_tokens as number) ?? 0,
    estimatedCostUSD: (t.estimated_cost_usd as number) ?? 0,
    updatedAt: t.updated_at as string,
  }));

  return apiSuccess({
    user: { name: profile.full_name, email: profile.email },
    threads,
  });
});
