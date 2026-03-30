import { createClient } from "@/gateways/supabase/server";
import { apiForbidden, apiNotFound, apiSuccess, apiUnauthorized } from "@/services/errors/api-response";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const { id: examId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, user_id, status, error_message")
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    return apiNotFound("Exame não encontrado.");
  }

  if (exam.user_id !== user.id) {
    return apiForbidden();
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id")
    .eq("exam_id", examId);

  const questionIds = (questions ?? []).map((question) => question.id);

  if (questionIds.length === 0) {
    return apiSuccess({
      status: exam.status,
      errorMessage: exam.error_message,
      progress: { total: 0, completed: 0, questionsCount: 0, questionsCompleted: 0 },
    });
  }

  const [{ count: total }, { count: completed }, { data: adaptationRows }] = await Promise.all([
    supabase
      .from("adaptations")
      .select("*", { count: "exact", head: true })
      .in("question_id", questionIds),
    supabase
      .from("adaptations")
      .select("*", { count: "exact", head: true })
      .in("question_id", questionIds)
      .eq("status", "completed"),
    supabase
      .from("adaptations")
      .select("question_id, status")
      .in("question_id", questionIds),
  ]);

  const grouped = new Map<string, boolean>();
  for (const row of adaptationRows ?? []) {
    const current = grouped.get(row.question_id) ?? true;
    grouped.set(row.question_id, current && row.status === "completed");
  }
  const questionsCompleted = [...grouped.values()].filter(Boolean).length;

  return apiSuccess({
    status: exam.status,
    errorMessage: exam.error_message,
    progress: {
      total: total ?? 0,
      completed: completed ?? 0,
      questionsCount: questionIds.length,
      questionsCompleted,
    },
  });
}
