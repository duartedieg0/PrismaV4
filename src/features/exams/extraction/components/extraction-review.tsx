"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/design-system/components/button";
import { EmptyState } from "@/design-system/components/empty-state";
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
        headers: { "Content-Type": "application/json" },
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
        throw new Error(payload.error?.message ?? "Erro ao salvar respostas.");
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
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border-default bg-white p-5">
        <div className="flex flex-col gap-1">
          <strong className="text-base font-semibold text-text-primary">Revisão humana das respostas</strong>
          <p className="text-sm text-text-secondary">
            Confirme a resposta correta de cada questão para liberar a etapa de adaptação.
          </p>
        </div>
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

      <div className="flex justify-end">
        <Button
          type="button"
          variant="accent"
          size="md"
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Salvando revisão" : "Avançar para adaptação"}
        </Button>
      </div>
    </div>
  );
}
