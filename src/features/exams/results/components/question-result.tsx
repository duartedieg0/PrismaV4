"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/design-system/components/badge";
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
  const [showOriginal, setShowOriginal] = useState(false);

  const selectedAdaptation =
    question.supports.find((support) => support.supportId === selectedSupportId) ??
    question.supports[0];

  return (
    <section
      aria-labelledby={`question-${question.questionId}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-border-default bg-white shadow-soft"
    >
      {/* ── Question Header ── */}
      <div className="flex items-start gap-4 border-b border-border-default bg-surface-muted/40 p-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-glow">
          {question.orderNum}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3
              id={`question-${question.questionId}`}
              className="text-base font-semibold text-text-primary"
            >
              Questão {question.orderNum}
            </h3>
            <Badge
              variant={question.questionType === "objective" ? "info" : "warning"}
              size="sm"
            >
              {question.questionType === "objective" ? "Objetiva" : "Dissertativa"}
            </Badge>
          </div>

          {/* Collapsible original content */}
          <button
            type="button"
            onClick={() => setShowOriginal(!showOriginal)}
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-text-muted transition-colors hover:text-text-secondary"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                showOriginal && "rotate-180",
              )}
            />
            {showOriginal ? "Ocultar original" : "Ver enunciado original"}
          </button>

          {showOriginal ? (
            <div className="animate-slide-down rounded-xl bg-white p-3 text-sm leading-relaxed text-text-secondary ring-1 ring-border-default">
              <p>{question.originalContent}</p>
              {question.originalAlternatives && question.originalAlternatives.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1">
                  {question.originalAlternatives.map((alt) => (
                    <li key={alt.label} className="text-xs text-text-muted">
                      <span className="font-semibold text-text-secondary">{alt.label})</span>{" "}
                      {alt.text}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Support Tabs ── */}
      <div className="border-b border-border-default px-5 pt-4 pb-0">
        <div
          aria-label={`Apoios da questão ${question.orderNum}`}
          role="tablist"
          className="flex gap-1"
        >
          {question.supports.map((support) => {
            const isSelected = support.supportId === selectedSupportId;
            const hasError = support.status === "error";

            return (
              <button
                aria-selected={isSelected}
                key={support.supportId}
                onClick={() => setSelectedSupportId(support.supportId)}
                role="tab"
                type="button"
                className={cn(
                  "relative px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                  "rounded-t-lg",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
                  isSelected
                    ? "bg-white text-brand-700"
                    : "text-text-muted hover:bg-surface-muted hover:text-text-secondary",
                  hasError && "text-danger",
                )}
              >
                {support.supportName}
                {isSelected ? (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-600" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Adaptation Content ── */}
      <div className="p-5">
        {selectedAdaptation ? (
          <AdaptationResultCard
            adaptation={selectedAdaptation}
            examId={examId}
            onCopy={onCopy}
          />
        ) : null}
      </div>
    </section>
  );
}
