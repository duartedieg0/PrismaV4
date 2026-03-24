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
        className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5"
      >
        <h2 id="processing-title" className="text-lg font-semibold text-emerald-900">
          Processamento concluído
        </h2>
        <p className="text-sm text-emerald-700">
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
        className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-5"
      >
        <h2 id="processing-title" className="text-lg font-semibold text-red-900">
          Erro no processamento
        </h2>
        <p className="text-sm text-red-700">
          {errorMessage ?? "Ocorreu um erro inesperado durante o processamento."}
        </p>
      </section>
    );
  }

  const percent =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <section
      aria-labelledby="processing-title"
      className="flex flex-col gap-4 rounded-2xl border border-border-default bg-white p-5 shadow-soft"
    >
      <h2 id="processing-title" className="text-lg font-semibold text-text-primary">
        Adaptando questões
      </h2>
      <p className="text-sm text-text-secondary">
        {progress.completed}/{progress.total} adaptações
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
    </section>
  );
}
