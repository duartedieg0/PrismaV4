"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BookOpen,
  GraduationCap,
  Calendar,
  ClipboardList,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/design-system/components/badge";
import { Button } from "@/design-system/components/button";
import { QuestionResult } from "@/features/exams/results/components/question-result";
import { buildExamCopyBlock } from "@/features/exams/results/copyable-block";
import type { ExamResultView } from "@/features/exams/results/contracts";

type ResultPageViewProps = {
  result: ExamResultView;
};

export function ResultPageView({ result }: ResultPageViewProps) {
  const [copiedSupportId, setCopiedSupportId] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/exams/${result.examId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "result_viewed" }),
    });
  }, [result.examId]);

  const stats = useMemo(() => {
    const totalQuestions = result.questions.length;
    const totalAdaptations = result.questions.reduce(
      (acc, q) => acc + q.supports.filter((s) => s.status === "completed").length,
      0,
    );
    const totalSupports = result.supportNames.length;
    return { totalQuestions, totalAdaptations, totalSupports };
  }, [result]);

  const formattedDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(result.createdAt));
    } catch {
      return result.createdAt;
    }
  }, [result.createdAt]);

  async function handleCopyAll(supportName: string, supportId: string) {
    const questionsForSupport = result.questions
      .map((q) => {
        const adaptation = q.supports.find((s) => s.supportId === supportId);
        if (!adaptation?.copyBlock) return null;
        return { orderNum: q.orderNum, copyBlock: adaptation.copyBlock };
      })
      .filter((q): q is NonNullable<typeof q> => q !== null);

    if (questionsForSupport.length === 0) return;

    const text = buildExamCopyBlock({
      examTitle: `${result.subjectName} — ${result.topicName}`,
      supportName,
      questions: questionsForSupport,
    });

    try {
      await navigator.clipboard.writeText(text);
      void fetch(`/api/exams/${result.examId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "exam_copy_compiled", supportId }),
      });
      setCopiedSupportId(supportId);
      setTimeout(() => setCopiedSupportId(null), 2500);
    } catch {
      /* clipboard failed */
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ── Hero Header ── */}
      <section className="relative overflow-hidden rounded-2xl border border-border-default bg-white shadow-card">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50/80 via-transparent to-accent-50/40" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8">
          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" size="sm">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {result.subjectName}
              </span>
            </Badge>
            <Badge variant="outline" size="sm">
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {result.gradeLevelName}
              </span>
            </Badge>
            <Badge variant="outline" size="sm">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
            </Badge>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-extrabold uppercase tracking-widest text-brand-600">
              Resultado consolidado
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {result.topicName}
            </h2>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3 ring-1 ring-border-default">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{stats.totalQuestions}</p>
                <p className="text-xs text-text-muted">Questões</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3 ring-1 ring-border-default">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{stats.totalAdaptations}</p>
                <p className="text-xs text-text-muted">Adaptações</p>
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-3 rounded-xl bg-white/70 p-3 ring-1 ring-border-default sm:col-span-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-100 text-accent-700">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{stats.totalSupports}</p>
                <p className="text-xs text-text-muted">Apoios</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bulk Copy per Support ── */}
      <section className="rounded-2xl border border-border-default bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold text-text-primary">Copiar prova completa</h3>
            <p className="text-xs text-text-muted">Copie todas as questões adaptadas por apoio</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.questions[0]?.supports.map((support) => {
              const isCopied = copiedSupportId === support.supportId;
              return (
                <Button
                  key={support.supportId}
                  variant={isCopied ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handleCopyAll(support.supportName, support.supportId)}
                >
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {isCopied ? "Copiado!" : support.supportName}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section Heading ── */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">
          Questões adaptadas
        </h2>
        <p className="text-sm text-text-secondary">
          Revise cada questão, copie o conteúdo e registre seu feedback.
        </p>
      </div>

      {/* ── Questions List ── */}
      <div className="flex flex-col gap-5">
        {result.questions.map((question, index) => (
          <div
            key={question.questionId}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: "backwards" }}
          >
            <QuestionResult examId={result.examId} question={question} />
          </div>
        ))}
      </div>
    </div>
  );
}
