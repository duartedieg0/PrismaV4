import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProcessingStatus } from "@/features/exams/results/components/processing-status";

describe("processing status", () => {
  it("renders phase-specific message for uploading status", () => {
    render(
      <ProcessingStatus
        examId="exam-1"
        status="uploading"
        errorMessage={null}
        progress={{ total: 0, completed: 0, questionsCount: 0 }}
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
        progress={{ total: 0, completed: 0, questionsCount: 0 }}
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
        progress={{ total: 0, completed: 0, questionsCount: 5 }}
      />,
    );

    expect(screen.getByText(/analisando questões/i)).toBeInTheDocument();
    expect(screen.getByText(/identificando estrutura/i)).toBeInTheDocument();
  });

  it("renders analyzing progress with adaptation count", () => {
    render(
      <ProcessingStatus
        examId="exam-1"
        status="analyzing"
        errorMessage={null}
        progress={{ total: 10, completed: 4, questionsCount: 5 }}
      />,
    );

    expect(screen.getByText(/adaptando questões/i)).toBeInTheDocument();
    expect(screen.getByText(/4\/10 adaptações concluídas/i)).toBeInTheDocument();
    expect(screen.getByText(/40% concluído/i)).toBeInTheDocument();
  });

  it("renders the completion CTA when processing is finished", () => {
    render(
      <ProcessingStatus
        examId="exam-1"
        status="completed"
        errorMessage={null}
        progress={{ total: 10, completed: 10, questionsCount: 5 }}
      />,
    );

    expect(screen.getByRole("link", { name: /ver resultado/i })).toHaveAttribute(
      "href",
      "/exams/exam-1/result",
    );
  });

  it("renders error state with action buttons", () => {
    render(
      <ProcessingStatus
        examId="exam-1"
        status="error"
        errorMessage="Falha no processamento."
        progress={{ total: 0, completed: 0, questionsCount: 0 }}
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
