import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import type { TeacherExamListItem } from "@/features/exams/dashboard/contracts";
import { DashboardHeader } from "@/features/exams/dashboard/components/dashboard-header";
import { ExamRepository } from "@/features/exams/dashboard/components/exam-repository";
import { ExamRepositoryEmpty } from "@/features/exams/dashboard/components/exam-repository-empty";

const exams: TeacherExamListItem[] = [
  {
    id: "exam-1",
    subjectName: "Matemática",
    gradeLevelName: "7º ano",
    topic: "Frações",
    supports: ["Dislexia", "TDAH"],
    status: "awaiting_answers",
    createdAt: "2026-03-21T11:00:00.000Z",
    updatedAt: "2026-03-21T11:30:00.000Z",
    errorMessage: null,
    href: "/exams/exam-1/extraction",
    statusLabel: "Aguardando respostas",
    statusTone: "outline",
  },
  {
    id: "exam-2",
    subjectName: "História",
    gradeLevelName: "8º ano",
    topic: "Brasil República",
    supports: ["TEA"],
    status: "error",
    createdAt: "2026-03-20T11:00:00.000Z",
    updatedAt: "2026-03-20T11:30:00.000Z",
    errorMessage: "Falha ao processar PDF.",
    href: "/exams/exam-2/processing",
    statusLabel: "Erro",
    statusTone: "destructive",
  },
];

describe("exam repository", () => {
  it("renders teacher context and status-aware repository items", () => {
    render(
      <TeacherShell
        title="Dashboard"
        breadcrumbs={[
          { label: "Inicio", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
        ]}
      >
        <DashboardHeader teacherName="Camila" stats={{ total: 2, processing: 1, completed: 0 }} />
        <ExamRepository exams={exams} />
      </TeacherShell>,
    );

    expect(screen.getByRole("heading", { level: 1, name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/olá, camila/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /nova prova/i })[0]).toHaveAttribute(
      "href",
      "/exams/new",
    );
    expect(screen.getByText(/aguardando respostas/i)).toBeInTheDocument();
    expect(screen.getByText(/erro/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /frações/i })).toHaveAttribute(
      "href",
      "/exams/exam-1/extraction",
    );
    expect(screen.getByText(/dislexia/i)).toBeInTheDocument();
    expect(screen.getByText(/tdah/i)).toBeInTheDocument();
    expect(screen.getByText(/falha ao processar pdf/i)).toBeInTheDocument();
  });

  it("renders the empty state with a creation CTA", () => {
    render(<ExamRepositoryEmpty />);

    expect(screen.getByText(/nenhuma prova adaptada ainda/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nova prova/i })).toHaveAttribute(
      "href",
      "/exams/new",
    );
  });

  it("keeps room for future filters without implementing them yet", () => {
    render(<ExamRepository exams={exams} />);

    expect(screen.getByText(/filtros em breve/i)).toBeInTheDocument();
  });
});
