"use client";

import { useState } from "react";
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
      style={{
        display: "grid",
        gap: "1rem",
        padding: "1.25rem",
        borderRadius: "var(--radius-panel)",
        background: "rgba(255,255,255,0.78)",
        border: "1px solid var(--color-border-subtle)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <div style={{ display: "grid", gap: "0.4rem" }}>
        <h3 id={`question-${question.questionId}`} style={{ margin: 0 }}>
          Questão {question.orderNum}
        </h3>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>{question.originalContent}</p>
      </div>

      <div aria-label={`Apoios da questão ${question.orderNum}`} role="tablist" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {question.supports.map((support) => (
          <button
            aria-selected={support.supportId === selectedSupportId}
            key={support.supportId}
            onClick={() => setSelectedSupportId(support.supportId)}
            role="tab"
            type="button"
            style={{
              background: support.supportId === selectedSupportId ? "linear-gradient(135deg, var(--accent), #4f46e5)" : "rgba(248,250,252,0.95)",
              color: support.supportId === selectedSupportId ? "var(--color-text-inverted)" : "var(--color-text-primary)",
              border: support.supportId === selectedSupportId ? "1px solid transparent" : "1px solid var(--color-border-subtle)",
              boxShadow: "none",
            }}
          >
            {support.supportName}
          </button>
        ))}
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
