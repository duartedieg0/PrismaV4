"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown } from "lucide-react";
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
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v.trim().length > 0).length,
    [answers],
  );

  const allAnswered = answeredCount === questions.length && questions.length > 0;

  const nextUnansweredId = useMemo(() => {
    return questions.find((q) => !answers[q.id]?.trim())?.id ?? null;
  }, [questions, answers]);

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

  function scrollToNextUnanswered() {
    if (nextUnansweredId && questionRefs.current[nextUnansweredId]) {
      questionRefs.current[nextUnansweredId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Info box */}
      <div className="rounded-2xl border border-border-default bg-white p-5">
        <div className="flex flex-col gap-1">
          <strong className="text-base font-semibold text-text-primary">Revisão humana das respostas</strong>
          <p className="text-sm text-text-secondary">
            Esta etapa garante que a alternativa correta se mantenha na questão adaptada.
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-text-secondary">
          {answeredCount} de {questions.length} respondidas
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-300"
            style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      {questions.map((question) => (
        <div
          key={question.id}
          ref={(el) => { questionRefs.current[question.id] = el; }}
        >
          <QuestionReviewCard
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
        </div>
      ))}

      {/* Bottom submit button (hidden when fixed banner is visible) */}
      {!allAnswered ? (
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
      ) : null}

      {/* FAB: scroll to next unanswered */}
      {!allAnswered && nextUnansweredId && questions.length > 2 ? (
        <button
          type="button"
          onClick={scrollToNextUnanswered}
          aria-label="Próxima questão sem resposta"
          className="fixed right-6 bottom-6 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white shadow-elevated transition-transform hover:scale-105 active:scale-95"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      ) : null}

      {/* Fixed submit banner */}
      {allAnswered ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-default bg-white shadow-elevated animate-slide-up">
          <div className="container-page flex items-center justify-between py-3">
            <p className="text-sm font-medium text-text-primary">
              Todas as questões revisadas
            </p>
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
      ) : null}
    </div>
  );
}
