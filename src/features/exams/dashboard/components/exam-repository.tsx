import { ErrorState } from "@/design-system/components/error-state";
import { ExamRepositoryItem } from "@/features/exams/dashboard/components/exam-repository-item";
import type { TeacherExamListItem } from "@/features/exams/dashboard/contracts";

export function ExamRepository({
  exams,
  errorMessage,
}: Readonly<{
  exams: TeacherExamListItem[];
  errorMessage?: string;
}>) {
  return (
    <section aria-label="Repositório de provas" style={{ display: "grid", gap: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "center",
        }}
        >
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <h2 style={{ margin: 0, letterSpacing: "-0.04em" }}>Minhas provas</h2>
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
            Visualize rapidamente status, apoios e próximos passos.
          </span>
        </div>
        <span style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
          Filtros em breve
        </span>
      </div>
      {errorMessage ? <ErrorState message={errorMessage} /> : null}
      <ul
        style={{
          display: "grid",
          gap: "1.25rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(17rem, 1fr))",
          padding: 0,
          margin: 0,
        }}
      >
        {exams.map((exam) => (
          <ExamRepositoryItem key={exam.id} exam={exam} />
        ))}
      </ul>
    </section>
  );
}
