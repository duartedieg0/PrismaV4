import Link from "next/link";
import { Button } from "@/design-system/components/button";
import type { ExamStatus } from "@/domains/exams/contracts";

type ProcessingStatusProps = {
  examId: string;
  status: Exclude<ExamStatus, "awaiting_answers">;
  errorMessage: string | null;
  progress: {
    total: number;
    completed: number;
    questionsCount: number;
  };
};

const phaseMessages: Record<string, { title: string; description: string }> = {
  uploading: {
    title: "Enviando prova...",
    description: "Fazendo upload do arquivo PDF",
  },
  extracting: {
    title: "Extraindo questões...",
    description: "Lendo e interpretando o conteúdo da prova",
  },
  analyzing_early: {
    title: "Analisando questões...",
    description: "Identificando estrutura e nível de cada questão",
  },
  analyzing_adapting: {
    title: "Adaptando questões...",
    description: "",
  },
};

export function ProcessingStatus({
  examId,
  status,
  errorMessage,
  progress,
}: ProcessingStatusProps) {
  if (status === "completed") {
    return (
      <section
        aria-labelledby="processing-title"
        className="flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50 p-5"
      >
        <h2 id="processing-title" className="text-lg font-semibold text-green-900">
          Processamento concluído
        </h2>
        <p className="text-sm text-green-700">
          A adaptação da prova foi concluída com sucesso.
        </p>
        <div>
          <Link href={`/exams/${examId}/result`}>
            <Button variant="primary" size="sm">Ver Resultado</Button>
          </Link>
        </div>
      </section>
    );
  }

  if (status === "error") {
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

  const isAdapting = status === "analyzing" && progress.total > 0;
  const phaseKey = status === "analyzing"
    ? (isAdapting ? "analyzing_adapting" : "analyzing_early")
    : status;
  const phase = phaseMessages[phaseKey] ?? phaseMessages.extracting;
  const percent = isAdapting
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <section
      aria-labelledby="processing-title"
      className="flex flex-col gap-4 rounded-2xl border border-border-default bg-white p-5 shadow-soft"
    >
      <h2 id="processing-title" className="text-lg font-semibold text-text-primary">
        {phase.title}
      </h2>
      <p className="text-sm text-text-secondary">
        {isAdapting
          ? `${progress.completed}/${progress.total} adaptações concluídas`
          : phase.description}
      </p>
      <div className="overflow-hidden rounded-xl bg-surface-muted">
        {isAdapting ? (
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
        ) : (
          <div className="h-12 animate-pulse rounded-xl bg-brand-200/60" />
        )}
      </div>
    </section>
  );
}
