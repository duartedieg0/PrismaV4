import { redirect } from "next/navigation";
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { getProfileOrRedirect } from "@/features/auth/get-profile";
import { ProcessingStatus } from "@/features/exams/results/components/processing-status";
import { createClient } from "@/gateways/supabase/server";

type ProcessingPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProcessingPage({ params }: ProcessingPageProps) {
  const { id: examId } = await params;
  const supabase = await createClient();
  const profileResult = await getProfileOrRedirect({
    createClient: async () => supabase,
  });

  if (profileResult.kind === "redirect") {
    redirect(profileResult.redirectTo);
  }

  const { data: exam } = await supabase
    .from("exams")
    .select("id, user_id, status, error_message")
    .eq("id", examId)
    .single();

  if (!exam || exam.user_id !== profileResult.profile.id) {
    redirect("/dashboard");
  }

  if (exam.status === "awaiting_answers") {
    redirect(`/exams/${examId}/extraction`);
  }

  if (exam.status === "completed") {
    redirect(`/exams/${examId}/result`);
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id")
    .eq("exam_id", examId);

  const questionIds = (questions ?? []).map((question) => question.id);

  let totalAdaptations = 0;
  let completedAdaptations = 0;
  let questionsCompleted = 0;

  if (questionIds.length > 0) {
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

    totalAdaptations = total ?? 0;
    completedAdaptations = completed ?? 0;

    const grouped = new Map<string, boolean>();
    for (const row of adaptationRows ?? []) {
      const current = grouped.get(row.question_id) ?? true;
      grouped.set(row.question_id, current && row.status === "completed");
    }
    questionsCompleted = [...grouped.values()].filter(Boolean).length;
  }

  return (
    <TeacherShell
      title="Processamento da prova"
      description="Nosso Agente de IA especialista está analisando o enunciado e alternativas das questões."
      activeNav="results"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Processamento", href: `/exams/${examId}/processing` },
      ]}
    >
      <ProcessingStatus
        examId={examId}
        errorMessage={exam.error_message}
        progress={{
          total: totalAdaptations,
          completed: completedAdaptations,
          questionsCount: questionIds.length,
          questionsCompleted,
        }}
        status={exam.status}
      />
    </TeacherShell>
  );
}
