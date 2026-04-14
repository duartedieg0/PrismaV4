import { redirect } from "next/navigation";
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { getProfileOrRedirect } from "@/features/auth/get-profile";
import { ResultPageView } from "@/features/exams/results/components/result-page";
import { getExamResult } from "@/features/exams/results/get-exam-result";
import { createClient } from "@/gateways/supabase/server";

type ResultPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ExamResultQuery = {
  exam: {
    id: string;
    user_id: string;
    status: "uploading" | "extracting" | "awaiting_answers" | "analyzing" | "completed" | "error";
    topic: string | null;
    created_at: string;
    subjects: { name: string } | null;
    grade_levels: { name: string } | null;
  } | null;
  examSupports: Array<{
    supports: { id: string; name: string } | null;
  }>;
  questions: Array<{
    id: string;
    order_num: number;
    content: string;
    question_type: "objective" | "essay";
    alternatives: Array<{ label: string; text: string }> | null;
    adaptations: Array<{
      id: string;
      support_id: string;
      adapted_content: string | null;
      adapted_alternatives: Array<{
        id: string;
        label?: string;
        originalText: string;
        adaptedText: string;
        isCorrect: boolean;
        position: number;
      }> | null;
      bncc_skills: string[] | null;
      bloom_level: string | null;
      bncc_analysis: string | null;
      bloom_analysis: string | null;
      status: "pending" | "processing" | "completed" | "error";
      supports: { id: string; name: string } | null;
      feedbacks: Array<{
        id: string;
        rating: number;
        comment: string | null;
      }>;
    }>;
  }>;
};

function unwrapSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id: examId } = await params;
  const supabase = await createClient();
  const profileResult = await getProfileOrRedirect({
    createClient: async () => supabase,
  });

  if (profileResult.kind === "redirect") {
    redirect(profileResult.redirectTo);
  }

  const result = await getExamResult({
    examId,
    actorUserId: profileResult.profile.id,
    dependencies: {
      loadExamResult: async ({ examId: nextExamId }): Promise<ExamResultQuery> => {
        const { data: exam } = await supabase
          .from("exams")
          .select("id, user_id, status, topic, created_at, subjects(name), grade_levels(name)")
          .eq("id", nextExamId)
          .single();
        const { data: examSupports } = await supabase
          .from("exam_supports")
          .select("supports(id, name)")
          .eq("exam_id", nextExamId);
        const { data: questions } = await supabase
          .from("questions")
          .select(`
            id,
            order_num,
            content,
            question_type,
            alternatives,
            adaptations(
              id,
              support_id,
              adapted_content,
              adapted_alternatives,
              bncc_skills,
              bloom_level,
              bncc_analysis,
              bloom_analysis,
              status,
              supports(id, name),
              feedbacks(id, rating, comment)
            )
          `)
          .eq("exam_id", nextExamId)
          .order("order_num");

        return {
          exam: exam as ExamResultQuery["exam"],
          examSupports: ((examSupports ?? []) as Array<{ supports: { id: string; name: string }[] | { id: string; name: string } | null }>).map((item) => ({
            supports: unwrapSingleRelation(item.supports),
          })),
          questions: ((questions ?? []) as Array<{
            id: string;
            order_num: number;
            content: string;
            question_type: "objective" | "essay";
            alternatives: Array<{ label: string; text: string }> | null;
            adaptations: Array<{
              id: string;
              support_id: string;
              adapted_content: string | null;
              adapted_alternatives: Array<{
                id: string;
                label?: string;
                originalText: string;
                adaptedText: string;
                isCorrect: boolean;
                position: number;
              }> | null;
              bncc_skills: string[] | null;
              bloom_level: string | null;
              bncc_analysis: string | null;
              bloom_analysis: string | null;
              status: "pending" | "processing" | "completed" | "error";
              supports: { id: string; name: string }[] | { id: string; name: string } | null;
              feedbacks: Array<{
                id: string;
                rating: number;
                comment: string | null;
              }>;
            }>;
          }>).map((question) => ({
            ...question,
            adaptations: question.adaptations.map((adaptation) => ({
              ...adaptation,
              supports: unwrapSingleRelation(adaptation.supports),
            })),
          })),
        };
      },
    },
  });

  if (result.kind === "not_found" || result.kind === "forbidden") {
    redirect("/dashboard");
  }

  if (result.kind === "processing") {
    redirect(`/exams/${examId}/processing`);
  }

  return (
    <TeacherShell
      title="Resultado da adaptação"
      description="Revise a versão final por apoio, copie e registre feedback para o ciclo de melhoria."
      activeNav="results"
      primaryAction={{ label: "Nova Prova", href: "/exams/new", ariaLabel: "Nova adaptação" }}
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Início", href: "/dashboard" },
        { label: "Resultado", href: `/exams/${examId}/result` },
      ]}
    >
      <ResultPageView result={result.value} />
    </TeacherShell>
  );
}
