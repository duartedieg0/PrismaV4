import { createRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackForm } from "@/features/exams/results/components/feedback-form";

describe("FeedbackForm — forwardRef + onFeedbackSubmit", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  it("atribui ref ao elemento <form> quando fornecido via forwardRef", () => {
    const ref = createRef<HTMLFormElement>();
    render(
      <FeedbackForm
        ref={ref}
        examId="exam-1"
        adaptationId="adapt-1"
        existingFeedback={null}
      />,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("FORM");
  });

  it("não quebra quando nenhum ref é fornecido", () => {
    expect(() =>
      render(
        <FeedbackForm
          examId="exam-1"
          adaptationId="adapt-1"
          existingFeedback={null}
        />,
      ),
    ).not.toThrow();
  });

  it("chama onFeedbackSubmit após envio bem-sucedido", async () => {
    const onFeedbackSubmit = vi.fn();
    render(
      <FeedbackForm
        examId="exam-1"
        adaptationId="adapt-1"
        existingFeedback={null}
        onFeedbackSubmit={onFeedbackSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /5 estrelas/i }));
    fireEvent.click(screen.getByRole("button", { name: /enviar feedback/i }));

    await waitFor(() => {
      expect(onFeedbackSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it("não chama onFeedbackSubmit quando a API retorna erro", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const onFeedbackSubmit = vi.fn();
    render(
      <FeedbackForm
        examId="exam-1"
        adaptationId="adapt-1"
        existingFeedback={null}
        onFeedbackSubmit={onFeedbackSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /5 estrelas/i }));
    fireEvent.click(screen.getByRole("button", { name: /enviar feedback/i }));

    await waitFor(() => {
      expect(screen.getByText(/erro ao salvar/i)).toBeVisible();
    });
    expect(onFeedbackSubmit).not.toHaveBeenCalled();
  });
});
