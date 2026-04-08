import { createRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackForm } from "@/features/exams/results/components/feedback-form";
import { CopyActionBar } from "@/features/exams/results/components/copy-action-bar";

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

describe("CopyActionBar — onCopySuccess", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("chama onCopySuccess após cópia bem-sucedida", async () => {
    const onCopySuccess = vi.fn();
    render(
      <CopyActionBar
        examId="exam-1"
        adaptationId="adapt-1"
        text="conteúdo copiado"
        onCopySuccess={onCopySuccess}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /copiar adaptação/i }));

    await waitFor(() => {
      expect(onCopySuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("não chama onCopySuccess quando a cópia falha", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const onCopySuccess = vi.fn();
    render(
      <CopyActionBar
        examId="exam-1"
        adaptationId="adapt-1"
        text="conteúdo"
        onCopySuccess={onCopySuccess}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /copiar adaptação/i }));

    await waitFor(() => {
      expect(screen.getByText(/não foi possível copiar/i)).toBeVisible();
    });
    expect(onCopySuccess).not.toHaveBeenCalled();
  });
});

describe("CopyActionBar — popover de nudge", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renderiza o popover quando showFeedbackNudge é true", () => {
    render(
      <CopyActionBar
        examId="exam-1"
        text="conteúdo"
        showFeedbackNudge={true}
        onNudgeClose={vi.fn()}
        onScrollToFeedback={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: /avaliar adaptação/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/gostou desta adaptação/i),
    ).toBeInTheDocument();
  });

  it("não renderiza o popover quando showFeedbackNudge é false", () => {
    render(
      <CopyActionBar
        examId="exam-1"
        text="conteúdo"
        showFeedbackNudge={false}
      />,
    );

    expect(
      screen.queryByRole("dialog", { name: /avaliar adaptação/i }),
    ).not.toBeInTheDocument();
  });

  it("chama onNudgeClose ao clicar no botão fechar", () => {
    const onNudgeClose = vi.fn();
    render(
      <CopyActionBar
        examId="exam-1"
        text="conteúdo"
        showFeedbackNudge={true}
        onNudgeClose={onNudgeClose}
        onScrollToFeedback={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /fechar/i }));
    expect(onNudgeClose).toHaveBeenCalledTimes(1);
  });

  it("chama onScrollToFeedback ao clicar em Avaliar", () => {
    const onScrollToFeedback = vi.fn();
    render(
      <CopyActionBar
        examId="exam-1"
        text="conteúdo"
        showFeedbackNudge={true}
        onNudgeClose={vi.fn()}
        onScrollToFeedback={onScrollToFeedback}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /avaliar/i }));
    expect(onScrollToFeedback).toHaveBeenCalledTimes(1);
  });
});
