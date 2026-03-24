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

  const { data: questions } = await supabase
    .from("questions")
    .select("id")
    .eq("exam_id", examId);

  const questionIds = (questions ?? []).map((question) => question.id);

  let totalAdaptations = 0;
  let completedAdaptations = 0;

  if (questionIds.length > 0) {
    const { count: total } = await supabase
      .from("adaptations")
      .select("*", { count: "exact", head: true })
      .in("question_id", questionIds);
    const { count: completed } = await supabase
      .from("adaptations")
      .select("*", { count: "exact", head: true })
      .in("question_id", questionIds)
      .eq("status", "completed");

    totalAdaptations = total ?? 0;
    completedAdaptations = completed ?? 0;
  }

  return (
    <TeacherShell
      title="Processamento da prova"
      description="O sistema está acompanhando extração, análise e adaptação. Esta tela mantém o professor orientado durante o andamento."
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
        }}
        status={exam.status}
      />
    </TeacherShell>
  );
}
