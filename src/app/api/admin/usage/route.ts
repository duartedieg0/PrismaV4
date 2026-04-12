import { withAdminRoute } from "@/app/api/admin/with-admin-route";
import { apiSuccess, apiInternalError } from "@/services/errors/api-response";
import type { AdminUsageUser } from "@/features/admin/usage/contracts";

export const GET = withAdminRoute(async ({ supabase }) => {
  const [threadsResult, examUsageResult] = await Promise.all([
    supabase
      .from("consultant_threads")
      .select("teacher_id, estimated_cost_usd, updated_at, profiles(full_name, email)")
      .not("managed_session_id", "is", null),
    supabase
      .from("exam_usage")
      .select("exam_id, stage, estimated_cost_usd, created_at, exams!inner(user_id)"),
  ]);

  if (threadsResult.error) return apiInternalError(threadsResult.error.message);
  if (examUsageResult.error) return apiInternalError(examUsageResult.error.message);

  const threads = threadsResult.data ?? [];
  const examUsages = examUsageResult.data ?? [];

  // Agregar por usuário em JS (evita GROUP BY no Supabase JS)
  const userMap = new Map<string, AdminUsageUser>();
  // examsByUser: userId → Set<examId> to count unique exams per user
  const examsByUser = new Map<string, Set<string>>();

  // Aggregate threads
  for (const thread of threads) {
    const profile = thread.profiles as unknown as { full_name: string | null; email: string | null } | null;
    const cost = (thread.estimated_cost_usd as number) ?? 0;
    const updatedAt = thread.updated_at as string;
    const userId = thread.teacher_id;

    if (!userMap.has(userId)) {
      userMap.set(userId, {
        userId,
        name: profile?.full_name ?? null,
        email: profile?.email ?? null,
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
