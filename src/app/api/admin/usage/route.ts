import { withAdminRoute } from "@/app/api/admin/with-admin-route";
import { apiSuccess, apiInternalError } from "@/services/errors/api-response";
import type { AdminUsageUser } from "@/features/admin/usage/contracts";
import { createServiceRoleClient } from "@/gateways/supabase/service-role";

export const GET = withAdminRoute(async ({ supabase }) => {
  const serviceSupabase = createServiceRoleClient() ?? supabase;

  const [threadsResult, examUsageResult] = await Promise.all([
    serviceSupabase
      .from("consultant_threads")
      .select("teacher_id, estimated_cost_usd, updated_at")
      .not("managed_session_id", "is", null),
    serviceSupabase
      .from("exam_usage")
      .select("exam_id, stage, estimated_cost_usd, created_at, exams!inner(user_id)"),
  ]);

  if (threadsResult.error) return apiInternalError(threadsResult.error.message);
  if (examUsageResult.error) return apiInternalError(examUsageResult.error.message);

  const threads = threadsResult.data ?? [];
  const examUsages = examUsageResult.data ?? [];

  const userMap = new Map<string, AdminUsageUser>();
  const examsByUser = new Map<string, Set<string>>();

  // Aggregate threads
  for (const thread of threads) {
    const cost = (thread.estimated_cost_usd as number) ?? 0;
    const updatedAt = thread.updated_at as string;
    const userId = thread.teacher_id;

    if (!userMap.has(userId)) {
      userMap.set(userId, {
        userId,
        name: null,
        email: null,
        threadCount: 0,
        examCount: 0,
        costByCategory: { consultant: 0, extraction: 0, adaptation: 0 },
        estimatedCostUSD: 0,
        lastActivityAt: null,
      });
    }

    const user = userMap.get(userId)!;
    user.threadCount++;
    user.costByCategory.consultant += cost;
    user.estimatedCostUSD += cost;
    if (!user.lastActivityAt || updatedAt > user.lastActivityAt) {
      user.lastActivityAt = updatedAt;
    }
  }

  // Aggregate exam_usage
  for (const eu of examUsages) {
    const exam = eu.exams as unknown as { user_id: string } | null;
    if (!exam?.user_id) continue;

    const userId = exam.user_id;
    const examId = eu.exam_id as string;
    const cost = (eu.estimated_cost_usd as number) ?? 0;
    const createdAt = eu.created_at as string;
    const stage = eu.stage as "extraction" | "adaptation";

    if (!userMap.has(userId)) {
      userMap.set(userId, {
        userId,
        name: null,
        email: null,
        threadCount: 0,
        examCount: 0,
        costByCategory: { consultant: 0, extraction: 0, adaptation: 0 },
        estimatedCostUSD: 0,
        lastActivityAt: null,
      });
    }
    if (!examsByUser.has(userId)) examsByUser.set(userId, new Set());

    const user = userMap.get(userId)!;
    user.costByCategory[stage] += cost;
    user.estimatedCostUSD += cost;
    examsByUser.get(userId)!.add(examId);
    if (!user.lastActivityAt || createdAt > user.lastActivityAt) {
      user.lastActivityAt = createdAt;
    }
  }

  // Fill examCount per user
  for (const [userId, examIds] of examsByUser) {
    const user = userMap.get(userId);
    if (user) user.examCount = examIds.size;
  }

  // Load profiles separately to avoid FK join issues
  const allUserIds = [...userMap.keys()];
  if (allUserIds.length > 0) {
    const { data: profiles } = await serviceSupabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", allUserIds);

    for (const profile of profiles ?? []) {
      const user = userMap.get(profile.id);
      if (user) {
        user.name = profile.full_name as string | null;
        user.email = profile.email as string | null;
      }
    }
  }

  const users = [...userMap.values()].sort(
    (a, b) => b.estimatedCostUSD - a.estimatedCostUSD,
  );

  // Count unique exams in total
  const uniqueExamIds = new Set(examUsages.map((eu) => eu.exam_id as string));

  const totals = {
    sessions: threads.length,
    examCount: uniqueExamIds.size,
    estimatedCostUSD: users.reduce((sum, u) => sum + u.estimatedCostUSD, 0),
  };

  return apiSuccess({ totals, users });
});
