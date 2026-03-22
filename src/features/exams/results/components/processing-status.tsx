import Link from "next/link";
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
        style={{
          display: "grid",
          gap: "0.6rem",
          padding: "1.4rem",
          borderRadius: "1rem",
          background: "rgba(236,253,245,0.9)",
          border: "1px solid rgba(5,150,105,0.16)",
        }}
      >
        <h2 id="processing-title" style={{ margin: 0 }}>Processamento concluído</h2>
        <p style={{ margin: 0 }}>A adaptação da prova foi concluída com sucesso.</p>
        <Link href={`/exams/${examId}/result`}>Ver Resultado</Link>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section
        aria-labelledby="processing-title"
        style={{
          display: "grid",
          gap: "0.6rem",
          padding: "1.4rem",
          borderRadius: "1rem",
          background: "rgba(220,38,38,0.06)",
          border: "1px solid rgba(220,38,38,0.14)",
        }}
      >
        <h2 id="processing-title" style={{ margin: 0 }}>Erro no processamento</h2>
        <p style={{ margin: 0 }}>{errorMessage ?? "Ocorreu um erro inesperado durante o processamento."}</p>
      </section>
    );
  }

  const percent =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <section
      aria-labelledby="processing-title"
      style={{
        display: "grid",
        gap: "1rem",
        padding: "1.5rem",
        borderRadius: "1rem",
        background: "rgba(255,255,255,0.9)",
        border: "1px solid rgba(110,122,117,0.08)",
        boxShadow: "0 14px 34px rgba(28,25,23,0.05)",
      }}
    >
      <h2 id="processing-title" style={{ margin: 0 }}>Adaptando questões</h2>
      <p style={{ margin: 0 }}>
        {progress.completed}/{progress.total} adaptações
      </p>
      <div
        aria-label={`${percent}% concluído`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percent}
        role="progressbar"
        style={{
          padding: "0.95rem 1rem",
          borderRadius: "0.85rem",
          background: "rgba(250, 238, 220, 0.72)",
          color: "#9a6100",
          fontWeight: 800,
        }}
      >
        {percent}% concluído
      </div>
    </section>
  );
}
