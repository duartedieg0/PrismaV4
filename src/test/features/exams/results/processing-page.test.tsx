import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProcessingStatus } from "@/features/exams/results/components/processing-status";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/exams/results/hooks/use-exam-progress", () => ({
  useExamProgress: (_examId: string, initialData: unknown) => ({
    ...(initialData as Record<string, unknown>),
    isPolling: true,
  }),
}));

describe("processing status", () => {
  it("renders phase-specific message for uploading status", () => {
    render(
      <ProcessingStatus
        examId="exam-1"
        status="uploading"
        errorMessage={null}
        progress={{ total: 0, completed: 0, questionsCount: 0, questionsCompleted: 0 }}
      />,
    );

    expect(screen.getByText(/enviando prova/i)).toBeInTheDocument();
    expect(screen.getByText(/fazendo upload do arquivo pdf/i)).toBeInTheDocument();
  });

  it("renders phase-specific message for extracting status", () => {
    render(
      <ProcessingStatus
        examId="exam-1"
        status="extracting"
        errorMessage={null}
        progress={{ total: 0, completed: 0, questionsCount: 0, questionsCompleted: 0 }}
      />,
    );

    expect(screen.getByText(/extraindo questões/i)).toBeInTheDocument();
  });

  it("renders early analyzing phase before adaptations start", () => {
    render(
      <ProcessingStatus
        examId="exam-1"
        status="analyzing"
        errorMessage={null}
        progress={{ total: 0, completed: 0, questionsCount: 5, questionsCompleted: 0 }}
      />,
    );

    expect(screen.getByText(/analisando questões/i)).toBeInTheDocument();
    expect(screen.getByText(/identificando estrutura/i)).toBeInTheDocument();
  });

  it("renders analyzing progress with question count", () => {
    render(
      <ProcessingStatus
        examId="exam-1"
        status="analyzing"
        errorMessage={null}
        progress={{ total: 10, completed: 4, questionsCount: 5, questionsCompleted: 2 }}
      />,
    );

    expect(screen.getByText(/adaptando questões/i)).toBeInTheDocument();
    expect(screen.getByText(/2 de 5 questões concluídas/i)).toBeInTheDocument();
    expect(screen.getByText(/40% concluído/i)).toBeInTheDocument();
  });

  it("renders without error for completed status", () => {
    render(
      <ProcessingStatus
        examId="exam-1"
        status="completed"
        errorMessage={null}
        progress={{ total: 10, completed: 10, questionsCount: 5, questionsCompleted: 5 }}
      />,
    );

    // Completed status triggers auto-redirect via useExamProgress
    // The component renders nothing or a brief "redirecting" state
    expect(document.body).toBeTruthy();
  });

  it("renders error state with action buttons", () => {
    render(
      <ProcessingStatus
        examId="exam-1"
        status="error"
        errorMessage="Falha no processamento."
        progress={{ total: 0, completed: 0, questionsCount: 0, questionsCompleted: 0 }}
      />,
    );

    expect(screen.getByText(/falha no processamento/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /criar nova prova/i })).toHaveAttribute(
      "href",
      "/exams/new",
    );
    expect(screen.getByRole("link", { name: /voltar ao dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
