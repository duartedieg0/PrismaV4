import type { TeacherExamListItem } from "@/features/exams/dashboard/contracts";
import { ExamRepositoryItem } from "./exam-repository-item";

type ExamRepositoryProps = Readonly<{
  exams: TeacherExamListItem[];
}>;

export function ExamRepository({ exams }: ExamRepositoryProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-text-primary">Minhas provas</h3>
        <p className="text-sm text-text-secondary">
          Visualize o status, apoios educacionais e próximos passos de cada avaliação.
        </p>
      </div>

      <p className="text-xs text-text-muted italic">Filtros em breve</p>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(18rem, 1fr))" }}>
        {exams.map((exam) => (
          <ExamRepositoryItem key={exam.id} exam={exam} />
        ))}
      </div>
    </section>
  );
}
