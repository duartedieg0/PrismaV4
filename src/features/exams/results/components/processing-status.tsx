"use client";

import Link from "next/link";
import { Button } from "@/design-system/components/button";
import type { ExamStatus } from "@/domains/exams/contracts";
import { useExamProgress, type ExamProgressData } from "@/features/exams/results/hooks/use-exam-progress";
import { useRotatingMessage } from "@/features/exams/results/hooks/use-rotating-message";

type ProcessingStatusProps = {
  examId: string;
  status: ExamStatus;
  errorMessage: string | null;
  progress: {
    total: number;
    completed: number;
    questionsCount: number;
    questionsCompleted: number;
  };
};

const EXTRACTING_MESSAGES = [
  "Lendo o PDF...",
  "Identificando questões...",
  "Analisando alternativas...",
  "Interpretando enunciados...",
];

const ADAPTING_MESSAGES = [
  "Analisando habilidades BNCC...",
  "Identificando nível Bloom...",
  "Gerando adaptações...",
];

function formatQuestionsProgress(completed: number, total: number): string {
  if (completed === 1) {
    return `1 de ${total} questão concluída`;
  }
  return `${completed} de ${total} questões concluídas`;
}

export function ProcessingStatus({
  examId,
  status: initialStatus,
  errorMessage: initialErrorMessage,
  progress: initialProgress,
}: ProcessingStatusProps) {
  const initialData: ExamProgressData = {
    status: initialStatus,
    errorMessage: initialErrorMessage,
    progress: initialProgress,
  };

  const { status, errorMessage, progress } = useExamProgress(examId, initialData);

  if (status === "completed") {
    return null;
  }

  if (status === "awaiting_answers") {
    return null;
  }

  if (status === "error") {
    return <ErrorState errorMessage={errorMessage} />;
  }

  const isAdapting = status === "analyzing" && progress.total > 0;

  if (isAdapting) {
    return <AdaptingState progress={progress} />;
  }

  return <WaitingState status={status} />;
}

function ErrorState({ errorMessage }: { errorMessage: string | null }) {
  return (
    <section
      aria-labelledby="processing-title"
      className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5"
    >
      <h2 id="processing-title" className="text-lg font-semibold text-red-900">
        Erro no processamento
      </h2>
      <p className="text-sm text-red-700">
        {errorMessage ?? "Ocorreu um erro inesperado durante o processamento."}
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/exams/new">
          <Button variant="primary" size="sm">Criar nova prova</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">Voltar ao dashboard</Button>
        </Link>
      </div>
    </section>
  );
}

const WAITING_PHASES: Record<string, { title: string; description: string; messages?: string[] }> = {
  uploading: {
    title: "Enviando prova...",
    description: "Fazendo upload do arquivo PDF...",
  },
  extracting: {
    title: "Extraindo questões...",
    description: "Lendo e interpretando o conteúdo da prova",
    messages: EXTRACTING_MESSAGES,
  },
  analyzing: {
    title: "Analisando questões...",
    description: "Identificando estrutura e nível de cada questão",
  },
};

function WaitingState({ status }: { status: ExamStatus }) {
  const phase = WAITING_PHASES[status] ?? WAITING_PHASES.extracting;
  const messages = phase.messages ?? [phase.description];

  const rotatingMessage = useRotatingMessage(messages);

  return (
    <section
      aria-labelledby="processing-title"
      className="flex flex-col gap-4 rounded-2xl border border-border-default bg-white p-5 shadow-soft"
    >
      <h2 id="processing-title" className="text-lg font-semibold text-text-primary">
        {phase.title}
      </h2>
      <p className="text-sm text-text-secondary">
        {phase.messages ? rotatingMessage : phase.description}
      </p>
      <div className="overflow-hidden rounded-xl bg-surface-muted">
        <div className="h-12 animate-pulse rounded-xl bg-brand-200/60" />
      </div>
      <p className="text-xs text-text-tertiary">
        Isso geralmente leva entre 1 e 2 minutos
      </p>
    </section>
  );
}

function AdaptingState({
  progress,
}: {
  progress: ExamProgressData["progress"];
}) {
  const rotatingMessage = useRotatingMessage(ADAPTING_MESSAGES);
  const percent = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <section
      aria-labelledby="processing-title"
      className="flex flex-col gap-4 rounded-2xl border border-border-default bg-white p-5 shadow-soft"
    >
      <h2 id="processing-title" className="text-lg font-semibold text-text-primary">
        Adaptando questões...
      </h2>
      <p className="text-sm text-text-secondary">
        {formatQuestionsProgress(progress.questionsCompleted, progress.questionsCount)}
      </p>
      <div className="overflow-hidden rounded-xl bg-surface-muted">
        <div
          aria-label={`${percent}% concluído`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={percent}
          role="progressbar"
          className="rounded-xl bg-accent-500 px-4 py-3 text-sm font-bold text-white transition-all duration-500"
          style={{ width: `${Math.max(percent, 8)}%` }}
        >
          {percent}% concluído
        </div>
      </div>
      <p className="text-xs text-text-tertiary">
        {rotatingMessage}
      </p>
    </section>
  );
}
