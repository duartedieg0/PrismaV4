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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "result_viewed" }),
    });
  }, [result.examId]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border-default bg-white p-5">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-extrabold uppercase tracking-widest text-brand-600">
            Resultado consolidado
          </p>
          <h2 className="text-xl font-bold text-text-primary">{result.subjectName}</h2>
          <p className="text-sm text-text-secondary">{result.gradeLevelName}</p>
          <p className="text-sm text-text-secondary">{result.topicName}</p>
        </div>
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">Resultado da adaptação</h2>
        <p className="text-sm text-text-secondary">
          Seus comentários ajudam a melhorar futuras adaptações.
        </p>
      </section>

      <div className="flex flex-col gap-4">
        {result.questions.map((question) => (
          <QuestionResult examId={result.examId} key={question.questionId} question={question} />
        ))}
      </div>
    </div>
  );
}
