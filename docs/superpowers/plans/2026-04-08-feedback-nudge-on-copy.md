# Feedback Nudge ao Copiar Adaptação — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir um popover amigável solicitando avaliação ao clicar em "Copiar adaptação", somente quando o feedback ainda não foi enviado.

**Architecture:** `AdaptationResultCard` coordena dois novos estados (`showNudge`, `feedbackSubmitted`) e um `ref` para o formulário. `CopyActionBar` recebe props de nudge e renderiza o popover posicionado absolutamente. `FeedbackForm` migra para `forwardRef` e expõe callback de envio bem-sucedido.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest + Testing Library

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/features/exams/results/components/feedback-form.tsx` | Modificar | Adicionar `forwardRef` + prop `onFeedbackSubmit` |
| `src/features/exams/results/components/copy-action-bar.tsx` | Modificar | Adicionar prop `onCopySuccess` + popover do nudge |
| `src/features/exams/results/components/adaptation-result-card.tsx` | Modificar | Coordenar estados e conectar callbacks |
| `src/test/features/exams/results/feedback-nudge.test.tsx` | Criar | Testes do comportamento do nudge |

Os testes de regressão do fluxo existente ficam em `src/test/features/exams/results/result-page.test.tsx` (já existente — sem modificação necessária, mas deve continuar passando).

---

## Task 1: Migrar `FeedbackForm` para `forwardRef` + callback `onFeedbackSubmit`

**Files:**
- Modify: `src/features/exams/results/components/feedback-form.tsx`
- Test: `src/test/features/exams/results/feedback-nudge.test.tsx` (criar)

### Por que esta task primeiro?

A mudança para `forwardRef` é retrocompatível e é a base que as outras tasks dependem.

---

- [ ] **Step 1: Criar o arquivo de testes com os primeiros casos**

Crie `src/test/features/exams/results/feedback-nudge.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

```bash
npx vitest run src/test/features/exams/results/feedback-nudge.test.tsx
```

Esperado: FAIL — `FeedbackForm` não aceita `ref` nem `onFeedbackSubmit`.

- [ ] **Step 3: Implementar as mudanças no `FeedbackForm`**

No arquivo `src/features/exams/results/components/feedback-form.tsx`:

1. Adicionar `forwardRef` à assinatura do componente
2. Adicionar `onFeedbackSubmit?: () => void` ao tipo de props
3. Chamar `onFeedbackSubmit?.()` após `setStatus("success")`

```tsx
// Linha 1 — sem mudança
"use client";

import { forwardRef, useState } from "react";
// ... demais imports inalterados ...

type FeedbackFormProps = {
  examId: string;
  adaptationId: string;
  existingFeedback?: {
    rating: number;
    comment: string | null;
  } | null;
  onFeedbackSubmit?: () => void;  // ← novo
};

export const FeedbackForm = forwardRef<HTMLFormElement, FeedbackFormProps>(
  function FeedbackForm(
    { examId, adaptationId, existingFeedback, onFeedbackSubmit },
    ref,
  ) {
    // ... todo o estado interno existente, sem mudança ...

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (rating === 0) return;
      setStatus("pending");

      try {
        const response = await fetch(`/api/exams/${examId}/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adaptationId,
            rating,
            comment: comment.trim() ? comment.trim() : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao salvar feedback.");
        }

        setStatus("success");
        onFeedbackSubmit?.();  // ← novo: apenas quando ok
      } catch {
        setStatus("error");
      }
    }

    // ... demais estado e helpers inalterados ...

    return (
      <form
        ref={ref}  // ← único change no JSX: adicionar ref
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-border-default bg-surface-muted/30 p-4"
      >
        {/* ... restante do JSX completamente inalterado ... */}
      </form>
    );
  },
);
```

> **Atenção:** Copie TODO o JSX existente do componente — somente adicione `ref={ref}` no `<form>` e envolva com `forwardRef`. Não altere nenhum outro comportamento.

- [ ] **Step 4: Rodar os testes e confirmar que passam**

```bash
npx vitest run src/test/features/exams/results/feedback-nudge.test.tsx
```

Esperado: PASS nos 4 testes de `FeedbackForm`.

- [ ] **Step 5: Confirmar regressão zero nos testes existentes**

```bash
npx vitest run src/test/features/exams/results/result-page.test.tsx
```

Esperado: todos os testes existentes continuam PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/exams/results/components/feedback-form.tsx \
        src/test/features/exams/results/feedback-nudge.test.tsx
git commit -m "feat: FeedbackForm expõe ref e callback onFeedbackSubmit"
```

---

## Task 2: Adicionar `onCopySuccess` ao `CopyActionBar`

**Files:**
- Modify: `src/features/exams/results/components/copy-action-bar.tsx`
- Test: `src/test/features/exams/results/feedback-nudge.test.tsx`

### Por que esta task separada?

`onCopySuccess` é independente do popover — é apenas um hook de notificação pós-cópia. Isolar facilita testar.

---

- [ ] **Step 1: Escrever o teste para `onCopySuccess`**

Primeiro, adicione o import no **topo** do arquivo `feedback-nudge.test.tsx` (junto aos outros imports existentes):

```tsx
import { CopyActionBar } from "@/features/exams/results/components/copy-action-bar";
```

Depois, adicione o bloco `describe` ao final do arquivo:

```tsx
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
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx vitest run src/test/features/exams/results/feedback-nudge.test.tsx
```

Esperado: FAIL — `onCopySuccess` não existe.

- [ ] **Step 3: Implementar `onCopySuccess` no `CopyActionBar`**

Em `src/features/exams/results/components/copy-action-bar.tsx`:

```tsx
type CopyActionBarProps = {
  examId: string;
  adaptationId?: string;
  supportId?: string;
  text: string;
  onCopy?: (text: string) => Promise<void> | void;
  onCopySuccess?: () => void;       // ← novo
  showFeedbackNudge?: boolean;      // ← novo (usado na Task 3)
  onNudgeClose?: () => void;        // ← novo (usado na Task 3)
  onScrollToFeedback?: () => void;  // ← novo (usado na Task 3)
};
```

No `handleCopy`, insira a chamada logo após `setStatus("copied")`:

```tsx
setStatus("copied");
onCopySuccess?.();                         // ← novo
setTimeout(() => setStatus("idle"), 2500);
```

> As props `showFeedbackNudge`, `onNudgeClose` e `onScrollToFeedback` são declaradas no tipo agora mas usadas na Task 3. Deixe-as sem efeito por enquanto.

- [ ] **Step 4: Rodar os testes e confirmar que passam**

```bash
npx vitest run src/test/features/exams/results/feedback-nudge.test.tsx
```

Esperado: PASS em todos os testes até aqui.

- [ ] **Step 5: Commit**

```bash
git add src/features/exams/results/components/copy-action-bar.tsx \
        src/test/features/exams/results/feedback-nudge.test.tsx
git commit -m "feat: CopyActionBar notifica cópia bem-sucedida via onCopySuccess"
```

---

## Task 3: Renderizar o popover de nudge no `CopyActionBar`

**Files:**
- Modify: `src/features/exams/results/components/copy-action-bar.tsx`
- Test: `src/test/features/exams/results/feedback-nudge.test.tsx`

---

- [ ] **Step 1: Escrever os testes do popover**

Adicione ao arquivo de testes:

```tsx
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
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx vitest run src/test/features/exams/results/feedback-nudge.test.tsx
```

Esperado: FAIL — popover não existe ainda.

- [ ] **Step 3: Implementar o popover no `CopyActionBar`**

> **Importante:** Esta é uma modificação **aditiva** ao arquivo existente — não reescreva o arquivo do zero. As mudanças da Task 2 (`onCopySuccess`) já estão no arquivo e devem ser preservadas.

As mudanças necessárias são:
1. Adicionar `useEffect` de Escape no início do componente (após o `useState`)
2. Adicionar `useEffect` ao import (linha 3: `import { useEffect, useState } from "react"`)
3. Adicionar `X, ChevronRight` ao import de `lucide-react`
4. Trocar `className` do `<div>` raiz: adicionar `relative` ao início da lista de classes
5. Adicionar o bloco condicional do popover logo após a abertura do `<div>` raiz

**Imports atualizados (linha 3 do arquivo):**
```tsx
import { useEffect, useState } from "react";
```

**Import lucide-react atualizado:**
```tsx
import { Copy, Check, AlertCircle, X, ChevronRight } from "lucide-react";
```

**`useEffect` para Escape (adicionar logo após o `useState` existente):**
```tsx
useEffect(() => {
  if (!showFeedbackNudge) return;

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onNudgeClose?.();
    }
  }

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [showFeedbackNudge, onNudgeClose]);
```

**`<div>` raiz (trocar apenas `className`):**
```tsx
<div className="relative flex items-center gap-3 rounded-xl border border-border-default bg-surface-muted/50 px-4 py-3">
```

**Bloco do popover (adicionar imediatamente após a abertura do `<div>` raiz):**

  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-border-default bg-surface-muted/50 px-4 py-3">
      {/* Popover de nudge */}
      {showFeedbackNudge ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Avaliar adaptação"
          aria-describedby={`nudge-text-${adaptationId}`}
          className={cn(
            "absolute bottom-full left-0 mb-2 z-10",
            "w-full max-w-sm rounded-xl border border-border-default",
            "bg-white px-4 py-3 shadow-md",
            "flex items-start justify-between gap-3",
          )}
        >
          <p
            id={`nudge-text-${adaptationId}`}
            className="text-sm text-text-primary"
          >
            Gostou desta adaptação? Seu feedback ajuda a melhorar as próximas.
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onScrollToFeedback}
              className="gap-1"
            >
              Avaliar
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <button
              type="button"
              onClick={onNudgeClose}
              aria-label="Fechar"
              className="rounded p-1 text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Botão e status de cópia — inalterados */}
      <Button
        onClick={handleCopy}
        type="button"
        variant={status === "copied" ? "primary" : status === "error" ? "danger" : "outline"}
        size="sm"
        className="transition-all duration-200"
      >
        {status === "copied" ? (
          <Check className="h-3.5 w-3.5" />
        ) : status === "error" ? (
          <AlertCircle className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {status === "copied" ? "Copiado!" : status === "error" ? "Erro" : "Copiar adaptação"}
      </Button>

      <span
        aria-live="polite"
        className={cn(
          "text-xs transition-opacity duration-200",
          status === "idle" ? "opacity-0" : "opacity-100",
          status === "copied" ? "text-brand-600" : "text-danger",
        )}
      >
        {status === "copied" ? "Conteúdo copiado para a área de transferência." : null}
        {status === "error" ? "Não foi possível copiar. Tente novamente." : null}
      </span>
    </div>
  );
}
```

> **Nota sobre `adaptationId`:** O popover usa `adaptationId` em `aria-describedby`. Quando `adaptationId` é `undefined`, o valor será `"nudge-text-undefined"` — aceitável para acessibilidade, pois o atributo ainda aponta para o `<p>` correto.

- [ ] **Step 4: Rodar os testes e confirmar que passam**

```bash
npx vitest run src/test/features/exams/results/feedback-nudge.test.tsx
```

Esperado: PASS em todos.

- [ ] **Step 5: Confirmar regressão zero**

```bash
npx vitest run src/test/features/exams/results/result-page.test.tsx
```

Esperado: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/exams/results/components/copy-action-bar.tsx \
        src/test/features/exams/results/feedback-nudge.test.tsx
git commit -m "feat: CopyActionBar renderiza popover de nudge de feedback"
```

---

## Task 4: Coordenar estados no `AdaptationResultCard`

**Files:**
- Modify: `src/features/exams/results/components/adaptation-result-card.tsx`
- Test: `src/test/features/exams/results/feedback-nudge.test.tsx`

Esta task conecta tudo: os estados `showNudge` e `feedbackSubmitted`, o `feedbackRef` e os callbacks entre componentes.

---

- [ ] **Step 1: Escrever os testes de integração do nudge**

Primeiro, adicione os imports no **topo** do arquivo `feedback-nudge.test.tsx` (junto aos outros imports existentes):

```tsx
import { AdaptationResultCard } from "@/features/exams/results/components/adaptation-result-card";
import type { AdaptationResultView } from "@/features/exams/results/contracts";
```

Depois, declare a fixture e o bloco `describe` ao final do arquivo. A fixture `adaptationBase` vai **fora** do `describe`, no nível do módulo:

```tsx
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
    const copyButton = await waitFor(() =>
      screen.getByRole("button", { name: /copiar adaptação/i }),
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
    const copyButton = await waitFor(() =>
      screen.getByRole("button", { name: /copiar adaptação/i }),
    );
    fireEvent.click(copyButton);
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2));
    // Nudge não deve aparecer após feedback enviado
    expect(
      screen.queryByRole("dialog", { name: /avaliar adaptação/i }),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx vitest run src/test/features/exams/results/feedback-nudge.test.tsx
```

Esperado: FAIL — `AdaptationResultCard` não tem os estados de nudge.

- [ ] **Step 3: Implementar a coordenação no `AdaptationResultCard`**

```tsx
"use client";

import { useRef, useState } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import { CopyActionBar } from "@/features/exams/results/components/copy-action-bar";
import { FeedbackForm } from "@/features/exams/results/components/feedback-form";
import type { AdaptationResultView } from "@/features/exams/results/contracts";

type AdaptationResultCardProps = {
  examId: string;
  adaptation: AdaptationResultView;
  onCopy?: (text: string) => Promise<void> | void;
};

export function AdaptationResultCard({
  examId,
  adaptation,
  onCopy,
}: AdaptationResultCardProps) {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(
    adaptation.feedback !== null,
  );
  const [showNudge, setShowNudge] = useState(false);
  const feedbackRef = useRef<HTMLFormElement>(null);

  function handleCopySuccess() {
    if (!feedbackSubmitted && !showNudge) {
      setShowNudge(true);
    }
  }

  function handleNudgeClose() {
    setShowNudge(false);
  }

  function handleScrollToFeedback() {
    feedbackRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleFeedbackSubmit() {
    setFeedbackSubmitted(true);
    setShowNudge(false);
  }

  if (adaptation.status === "error") {
    return (
      // ... bloco de erro existente, inalterado ...
    );
  }

  if (!adaptation.adaptedContent) {
    return (
      // ... bloco de "não disponível" existente, inalterado ...
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Adapted Content — inalterado ── */}
      {/* ... todo o bloco de conteúdo adaptado existente ... */}

      {/* ── Copy Bar ── */}
      {adaptation.copyBlock ? (
        <CopyActionBar
          adaptationId={adaptation.adaptationId}
          examId={examId}
          onCopy={onCopy}
          onCopySuccess={handleCopySuccess}
          showFeedbackNudge={showNudge}
          onNudgeClose={handleNudgeClose}
          onScrollToFeedback={handleScrollToFeedback}
          supportId={adaptation.supportId}
          text={adaptation.copyBlock.text}
        />
      ) : null}

      {/* ── Feedback ── */}
      <FeedbackForm
        ref={feedbackRef}
        adaptationId={adaptation.adaptationId}
        examId={examId}
        existingFeedback={adaptation.feedback}
        onFeedbackSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}
```

> **Atenção:** Copie TODO o JSX existente dos blocos de conteúdo adaptado e de erro — apenas adicione os novos estados, callbacks e as novas props nos dois componentes filhos.

- [ ] **Step 4: Rodar os testes e confirmar que passam**

```bash
npx vitest run src/test/features/exams/results/feedback-nudge.test.tsx
```

Esperado: PASS em todos os testes.

- [ ] **Step 5: Confirmar regressão zero na suite completa**

```bash
npx vitest run src/test/features/exams/results/
```

Esperado: PASS em todos os arquivos da pasta.

- [ ] **Step 6: Rodar a suite completa**

```bash
npx vitest run
```

Esperado: nenhum teste falhando.

- [ ] **Step 7: Commit**

```bash
git add src/features/exams/results/components/adaptation-result-card.tsx \
        src/test/features/exams/results/feedback-nudge.test.tsx
git commit -m "feat: nudge de feedback ao copiar adaptação"
```

---

## Checklist de verificação final

Após todas as tasks, confirme visualmente no browser:

- [ ] Abrir uma prova com adaptação concluída
- [ ] Clicar em "Copiar adaptação" → popover aparece acima do botão
- [ ] Clicar em "Avaliar →" → scroll suave até o formulário de avaliação
- [ ] Fechar o popover via ✕ → desaparece
- [ ] Copiar novamente → popover reaparece
- [ ] Pressionar Escape com popover aberto → desaparece
- [ ] Enviar feedback (selecionar estrelas + clicar Enviar) → popover fecha e não volta ao copiar de novo
- [ ] Recarregar a página com feedback já enviado → ao copiar, nenhum popover aparece
