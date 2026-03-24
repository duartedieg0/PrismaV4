import { redirect } from "next/navigation";
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { createClient } from "@/gateways/supabase/server";
import { getProfileOrRedirect } from "@/features/auth/get-profile";
import { ExtractionReview } from "@/features/exams/extraction/components/extraction-review";

type ExtractionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExtractionPage({ params }: ExtractionPageProps) {
  const { id: examId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profileResult = await getProfileOrRedirect({
    createClient: async () => supabase,
  });

  if (profileResult.kind === "redirect") {
    redirect(profileResult.redirectTo);
  }

  const { data: exam } = await supabase
    .from("exams")
    .select("id, user_id, status")
    .eq("id", examId)
    .single();

  if (!exam || exam.user_id !== profileResult.profile.id) {
    redirect("/dashboard");
  }

  if (exam.status !== "awaiting_answers") {
    redirect(`/exams/${examId}/processing`);
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, order_num, content, question_type, alternatives, visual_elements, extraction_warning")
    .eq("exam_id", examId)
    .order("order_num");

  return (
    <TeacherShell
      title="Revisão da extração"
      description="Valide as questões extraídas e confirme as respostas corretas antes de enviar a prova para adaptação."
      activeNav="results"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Revisão da extração", href: `/exams/${examId}/extraction` },
      ]}
    >
      <ExtractionReview
        examId={examId}
        questions={(questions ?? []).map((question) => ({
          id: question.id,
          orderNum: question.order_num,
          content: question.content,
          questionType: question.question_type,
          alternatives:
            typeof question.alternatives === "string"
              ? JSON.parse(question.alternatives)
              : question.alternatives,
          visualElements:
            typeof question.visual_elements === "string"
              ? JSON.parse(question.visual_elements)
              : question.visual_elements,
          extractionWarning: question.extraction_warning,
        }))}
      />
    </TeacherShell>
  );
}
