import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProcessingStatus } from "@/features/exams/results/components/processing-status";

describe("processing status", () => {
  it("renders analyzing progress with an explicit message", () => {
    render(
      <ProcessingStatus
        examId="exam-1"
        status="analyzing"
        errorMessage={null}
        progress={{ total: 10, completed: 4, questionsCount: 5 }}
      />,
    );

    expect(screen.getByText(/adaptando questões/i)).toBeInTheDocument();
    expect(screen.getByText(/4\/10 adaptações/i)).toBeInTheDocument();
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
});
