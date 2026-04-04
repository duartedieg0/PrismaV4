"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { Badge } from "@/design-system/components/badge";
import { AdaptationResultCard } from "@/features/exams/results/components/adaptation-result-card";
import { PedagogicalDetails } from "@/features/exams/results/components/pedagogical-details";
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

  const hasSupports = question.supports.length > 0;

  return (
    <section
      aria-labelledby={`question-${question.questionId}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-border-default bg-white shadow-soft"
    >
      {/* ── Question Header ── */}
      <div className="flex items-center gap-4 border-b border-border-default bg-surface-muted/40 p-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-soft">
          {question.orderNum}
        </span>
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

      {/* ── Side-by-Side Grid ── */}
      <div className={cn(
        "grid items-start gap-4 p-5 md:gap-5",
        hasSupports ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
      )}>
        {/* ── Left Panel: Original Content ── */}
        <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-border-default">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-text-muted" />
            <h4 className="text-sm font-semibold text-text-primary">
              Enunciado original
            </h4>
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            {question.originalContent}
          </p>
          {question.originalAlternatives && question.originalAlternatives.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {question.originalAlternatives.map((alt) => (
                <li key={alt.label} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-xs font-bold text-text-secondary">
                    {alt.label}
                  </span>
                  <span>{alt.text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* ── Right Panel: Adapted Content ── */}
        {hasSupports ? (
          <div className="flex flex-col overflow-hidden rounded-xl ring-1 ring-brand-200/50">
            {/* Support Tabs */}
            <div className="border-b border-brand-200/50 px-4 pt-3 pb-0">
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
                          ? "bg-brand-50/50 text-brand-700"
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

            {/* Adaptation Content */}
            <div className="bg-brand-50/50 p-4">
              {selectedAdaptation ? (
                <AdaptationResultCard
                  adaptation={selectedAdaptation}
                  examId={examId}
                  onCopy={onCopy}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-muted">Nenhuma adaptação disponível.</p>
        )}
      </div>

      {/* ── Pedagogical Details (full-width below grid) ── */}
      {selectedAdaptation &&
        (selectedAdaptation.bnccSkills?.length || selectedAdaptation.bloomLevel) ? (
        <div className="border-t border-border-default px-5 py-4">
          <PedagogicalDetails
            bnccSkills={selectedAdaptation.bnccSkills}
            bloomLevel={selectedAdaptation.bloomLevel}
            bnccAnalysis={selectedAdaptation.bnccAnalysis}
            bloomAnalysis={selectedAdaptation.bloomAnalysis}
          />
        </div>
      ) : null}
    </section>
  );
}
