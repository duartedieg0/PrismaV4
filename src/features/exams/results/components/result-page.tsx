"use client";

import { useEffect } from "react";
import { QuestionResult } from "@/features/exams/results/components/question-result";
import type { ExamResultView } from "@/features/exams/results/contracts";

type ResultPageViewProps = {
  result: ExamResultView;
};

export function ResultPageView({ result }: ResultPageViewProps) {
  useEffect(() => {
    void fetch(`/api/exams/${result.examId}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "result_viewed",
      }),
    });
  }, [result.examId]);

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <section
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "1.35rem 1.45rem",
          borderRadius: "1rem",
          background: "rgba(255,255,255,0.84)",
          border: "1px solid rgba(110,122,117,0.08)",
          boxShadow: "0 14px 34px rgba(28,25,23,0.04)",
        }}
      >
        <p style={{ margin: 0, color: "var(--color-text-accent)", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.78rem" }}>
          Resultado consolidado
        </p>
        <h2 style={{ margin: 0 }}>{result.subjectName}</h2>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>{result.gradeLevelName}</p>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>{result.topicName}</p>
      </section>

      <section style={{ display: "grid", gap: "0.35rem" }}>
        <h2 style={{ margin: 0, letterSpacing: "-0.04em" }}>Resultado da adaptação</h2>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
          Seus comentários ajudam a melhorar futuras adaptações.
        </p>
      </section>

      <div style={{ display: "grid", gap: "1rem" }}>
        {result.questions.map((question) => (
          <QuestionResult examId={result.examId} key={question.questionId} question={question} />
        ))}
      </div>
    </div>
  );
}
