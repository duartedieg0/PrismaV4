import { withAdminRoute } from "@/app/api/admin/with-admin-route";
import { apiSuccess, apiInternalError } from "@/services/errors/api-response";
import type { AdminUsageUser } from "@/features/admin/usage/contracts";

export const GET = withAdminRoute(async ({ supabase }) => {
  const { data, error } = await supabase
    .from("consultant_threads")
    .select(
      "teacher_id, estimated_cost_usd, updated_at, profiles(full_name, email)",
    )
    .not("managed_session_id", "is", null);

  if (error) return apiInternalError(error.message);

  const threads = data ?? [];

  // Agregar por usuário em JS (evita GROUP BY no Supabase JS)
  const userMap = new Map<string, AdminUsageUser>();

  for (const thread of threads) {
    const profile = thread.profiles as { full_name: string | null; email: string | null } | null;
    const cost = (thread.estimated_cost_usd as number) ?? 0;
    const updatedAt = thread.updated_at as string;

    if (!userMap.has(thread.teacher_id)) {
      userMap.set(thread.teacher_id, {
        userId: thread.teacher_id,
        name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        threadCount: 0,
        estimatedCostUSD: 0,
        lastActivityAt: updatedAt,
      });
    }

    const user = userMap.get(thread.teacher_id)!;
    user.threadCount++;
    user.estimatedCostUSD += cost;
    if (updatedAt > (user.lastActivityAt ?? "")) {
      user.lastActivityAt = updatedAt;
    }
  }

  const users = [...userMap.values()].sort(
    (a, b) => b.estimatedCostUSD - a.estimatedCostUSD,
  );

  const totals = {
    sessions: threads.length,
    estimatedCostUSD: users.reduce((sum, u) => sum + u.estimatedCostUSD, 0),
  };

  return apiSuccess({ totals, users });
});
