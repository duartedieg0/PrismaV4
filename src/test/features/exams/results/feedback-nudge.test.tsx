import { createRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackForm } from "@/features/exams/results/components/feedback-form";
import { CopyActionBar } from "@/features/exams/results/components/copy-action-bar";
import { AdaptationResultCard } from "@/features/exams/results/components/adaptation-result-card";
import type { AdaptationResultView } from "@/features/exams/results/contracts";

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

  it("chama onNudgeClose ao pressionar Escape", () => {
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

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onNudgeClose).toHaveBeenCalledTimes(1);
  });
});

const adaptationBase: AdaptationResultView = {
  adaptationId: "adapt-1",
  supportId: "support-1",
  supportName: "Dislexia",
  status: "completed",
  adaptedContent: "Conteúdo adaptado",
  adaptedAlternatives: null,
  bnccSkills: null,
  bloomLevel: null,
  bnccAnalysis: null,
  bloomAnalysis: null,
  copyBlock: { type: "objective", text: "Conteúdo adaptado" },
  feedback: null,
};

describe("AdaptationResultCard — feedback nudge", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("exibe nudge após cópia bem-sucedida quando feedback é null", async () => {
    render(
      <AdaptationResultCard examId="exam-1" adaptation={adaptationBase} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /copiar adaptação/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /avaliar adaptação/i }),
      ).toBeInTheDocument();
    });
  });

  it("não exibe nudge quando adaptation.feedback já existe", async () => {
    render(
      <AdaptationResultCard
        examId="exam-1"
        adaptation={{ ...adaptationBase, feedback: { id: "fb-1", rating: 4, comment: null } }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /copiar adaptação/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
    expect(
      screen.queryByRole("dialog", { name: /avaliar adaptação/i }),
    ).not.toBeInTheDocument();
  });

  it("fecha o nudge ao clicar em ✕", async () => {
    render(
      <AdaptationResultCard examId="exam-1" adaptation={adaptationBase} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /copiar adaptação/i }));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: /avaliar adaptação/i })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /fechar/i }));
    expect(
      screen.queryByRole("dialog", { name: /avaliar adaptação/i }),
    ).not.toBeInTheDocument();
  });

  it("reabre o nudge ao copiar novamente após fechar", async () => {
    render(
      <AdaptationResultCard examId="exam-1" adaptation={adaptationBase} />,
    );

    // Primeiro clique — abre nudge
    fireEvent.click(screen.getByRole("button", { name: /copiar adaptação/i }));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: /avaliar adaptação/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /fechar/i }));
    expect(
      screen.queryByRole("dialog", { name: /avaliar adaptação/i }),
    ).not.toBeInTheDocument();

    // Aguarda o botão voltar ao label "Copiar adaptação" (após 2500ms de "Copiado!")
    const copyButton = await waitFor(
      () => screen.getByRole("button", { name: /copiar adaptação/i }),
      { timeout: 3500 },
    );
    fireEvent.click(copyButton);
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: /avaliar adaptação/i })).toBeInTheDocument(),
    );
  });

  it("fecha o nudge e não o exibe novamente após envio de feedback", async () => {
    render(
      <AdaptationResultCard examId="exam-1" adaptation={adaptationBase} />,
    );

    // Abrir nudge
    fireEvent.click(screen.getByRole("button", { name: /copiar adaptação/i }));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: /avaliar adaptação/i })).toBeInTheDocument(),
    );

    // Enviar feedback
    fireEvent.click(screen.getByRole("button", { name: /5 estrelas/i }));
    fireEvent.click(screen.getByRole("button", { name: /enviar feedback/i }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: /avaliar adaptação/i })).not.toBeInTheDocument(),
    );

    // Aguarda o botão voltar ao label "Copiar adaptação" e copia novamente
    const copyButton = await waitFor(
      () => screen.getByRole("button", { name: /copiar adaptação/i }),
      { timeout: 3500 },
    );
    fireEvent.click(copyButton);
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2));
    // Nudge não deve aparecer após feedback enviado
    expect(
      screen.queryByRole("dialog", { name: /avaliar adaptação/i }),
    ).not.toBeInTheDocument();
  });
});
