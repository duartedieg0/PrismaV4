"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmptyState } from "@/design-system/components/empty-state";
import { Surface } from "@/design-system/components/surface";
import { QuestionReviewCard } from "@/features/exams/extraction/components/question-review-card";

type ExtractionReviewProps = Readonly<{
  examId: string;
  questions: Array<{
    id: string;
    orderNum: number;
    content: string;
    questionType: "objective" | "essay";
    alternatives: Array<{ label: string; text: string }> | null;
    visualElements: Array<{ type: string; description: string }> | null;
    extractionWarning: string | null;
  }>;
}>;

export function ExtractionReview({
  examId,
  questions,
}: ExtractionReviewProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (questions.length === 0) {
    return <EmptyState message="Nenhuma questão foi extraída para revisão." />;
  }

  async function handleSubmit() {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/exams/${examId}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: questions
            .map((question) => ({
              questionId: question.id,
              correctAnswer: answers[question.id] ?? "",
            }))
            .filter((answer) => answer.correctAnswer.trim().length > 0),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Erro ao salvar respostas.");
      }

      toast.success("Respostas salvas. A adaptação foi iniciada.");
      startTransition(() => {
        router.refresh();
        router.push(`/exams/${examId}/processing`);
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar respostas.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Surface padding="clamp(1.4rem, 2vw, 1.9rem)">
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div
          style={{
            display: "grid",
            gap: "0.45rem",
            padding: "1.1rem 1.2rem",
            borderRadius: "1rem",
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(110,122,117,0.08)",
            boxShadow: "0 14px 30px rgba(28,25,23,0.04)",
          }}
        >
          <strong>Revisão humana das respostas</strong>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            Confirme a resposta correta de cada questão para liberar a etapa de adaptação.
          </p>
        </div>
        {questions.map((question) => (
          <QuestionReviewCard
            key={question.id}
            question={question}
            value={answers[question.id] ?? ""}
            disabled={isSubmitting}
            onChange={(nextValue) => {
              setAnswers((current) => ({
                ...current,
                [question.id]: nextValue,
              }));
            }}
          />
        ))}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            style={{
              borderRadius: "0.85rem",
              background: "linear-gradient(135deg, #9a6100, #c88718)",
              boxShadow: "0 14px 30px rgba(154, 97, 0, 0.14)",
            }}
          >
            {isSubmitting ? "Salvando revisão" : "Avançar para adaptação"}
          </button>
        </div>
      </div>
    </Surface>
  );
}
