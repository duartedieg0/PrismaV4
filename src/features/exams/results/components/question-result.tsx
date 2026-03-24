"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AdaptationResultCard } from "@/features/exams/results/components/adaptation-result-card";
import type { QuestionResultView } from "@/features/exams/results/contracts";

type QuestionResultProps = {
  examId: string;
  question: QuestionResultView;
  onCopy?: (text: string) => Promise<void> | void;
};

export function QuestionResult({ examId, question, onCopy }: QuestionResultProps) {
  const [selectedSupportId, setSelectedSupportId] = useState(
    question.supports[0]?.supportId ?? "",
  );
  const selectedAdaptation =
    question.supports.find((support) => support.supportId === selectedSupportId) ??
    question.supports[0];

  return (
    <section
      aria-labelledby={`question-${question.questionId}`}
      className="flex flex-col gap-4 rounded-2xl border border-border-default bg-white p-5 shadow-soft"
    >
      <div className="flex flex-col gap-1">
        <h3 id={`question-${question.questionId}`} className="text-base font-semibold text-text-primary">
          Questão {question.orderNum}
        </h3>
        <p className="text-sm text-text-secondary">{question.originalContent}</p>
      </div>

      <div aria-label={`Apoios da questão ${question.orderNum}`} role="tablist" className="flex flex-wrap gap-2">
        {question.supports.map((support) => {
          const isSelected = support.supportId === selectedSupportId;

          return (
            <button
              aria-selected={isSelected}
              key={support.supportId}
              onClick={() => setSelectedSupportId(support.supportId)}
              role="tab"
              type="button"
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                isSelected
                  ? "bg-brand-600 text-white shadow-glow"
                  : "border border-border-default bg-white text-text-primary hover:bg-surface-muted",
              )}
            >
              {support.supportName}
            </button>
          );
        })}
      </div>

      {selectedAdaptation ? (
        <AdaptationResultCard
          adaptation={selectedAdaptation}
          examId={examId}
          onCopy={onCopy}
        />
      ) : null}
    </section>
  );
}
