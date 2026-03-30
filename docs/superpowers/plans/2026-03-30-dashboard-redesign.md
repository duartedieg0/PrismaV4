# Dashboard & Internal Pages Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all teacher-facing pages to the new indigo/terracotta design system and apply focused UX improvements.

**Architecture:** Pure frontend changes — no new API endpoints, no schema changes. Each task targets one component or a tight cluster of related components. Token migration uses Tailwind utility classes mapped to CSS variables from `globals.css`. New UX features (progress indicators, FAB, fixed banner) are client-side state additions to existing components.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS v4, Vitest + Testing Library, Lucide icons.

**Spec:** `docs/superpowers/specs/2026-03-29-dashboard-redesign-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/design-system/components/status-badge.tsx` | Migrate inline styles → Tailwind classes |
| Modify | `src/features/exams/dashboard/components/exam-repository-item.tsx` | Replace hardcoded hex/emerald colors, update action labels, add date tooltip |
| Modify | `src/features/exams/dashboard/components/exam-repository.tsx` | Remove filter placeholder, fix inline grid style |
| Modify | `src/app/(auth)/dashboard/page.tsx` | Replace inline style with Tailwind |
| Modify | `src/features/exams/results/components/processing-status.tsx` | Migrate colors, add phase-aware messaging, add error action buttons |
| Modify | `src/features/exams/results/components/adaptation-result-card.tsx` | Replace emerald → green, collapsible pedagogical tags |
| Modify | `src/features/exams/results/components/result-page.tsx` | Fix stat icon colors, make bulk copy always visible |
| Modify | `src/features/exams/results/components/copy-action-bar.tsx` | Remove redundant className override |
| Modify | `src/features/exams/results/components/feedback-form.tsx` | Replace stone-300 → text-muted |
| Modify | `src/features/exams/extraction/components/extraction-warning-list.tsx` | Replace amber-600 → warning token |
| Modify | `src/features/exams/extraction/components/extraction-review.tsx` | Add progress indicator, FAB, fixed submit banner |
| Modify | `src/features/exams/extraction/components/question-review-card.tsx` | Replace hardcoded input classes |
| Modify | `src/features/exams/create/components/new-exam-form.tsx` | Required markers, onBlur validation, replace inputClass |
| Modify | `src/test/features/exams/dashboard/exam-repository.test.tsx` | Update for removed filter placeholder + new action labels |
| Modify | `src/test/features/exams/results/processing-page.test.tsx` | Update for phase-aware messaging |
| Modify | `src/test/features/exams/results/result-page.test.tsx` | Update for visible bulk copy + collapsible pedagogical tags |
| Modify | `src/test/features/exams/extraction/extraction-review.test.tsx` | Add tests for progress indicator, FAB, fixed submit banner |

---

### Task 1: StatusBadge — Migrate inline styles to Tailwind

**Files:**
- Modify: `src/design-system/components/status-badge.tsx`

- [ ] **Step 1: Replace the entire status-badge.tsx with Tailwind-based implementation**

Replace the `toneStyles` object and inline `style` prop with Tailwind classes:

```tsx
import { cn } from "@/lib/utils";

type StatusBadgeProps = Readonly<{
  label: string;
  tone?: "default" | "secondary" | "destructive" | "outline" | "warning";
}>;

const toneClasses = {
  default: "bg-green-50 text-green-700 border-green-200",
  secondary: "bg-surface-muted text-text-secondary border-border-default",
  destructive: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  outline: "bg-white/70 text-text-primary border-border-strong",
} as const;

export function StatusBadge({ label, tone = "default" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-pill border px-3 py-1.5 text-xs font-bold uppercase tracking-wider",
        toneClasses[tone],
      )}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Run tests to verify nothing breaks**

Run: `npx vitest run --config vitest.config.mts --reporter verbose 2>&1 | head -60`

All tests referencing StatusBadge should still pass since no API changed — only visual output.

- [ ] **Step 3: Commit**

```bash
git add src/design-system/components/status-badge.tsx
git commit -m "refactor(status-badge): migrate inline styles to Tailwind classes"
```

---

### Task 2: ExamRepositoryItem — Colors, action labels, date tooltip

**Files:**
- Modify: `src/features/exams/dashboard/components/exam-repository-item.tsx`
- Modify: `src/test/features/exams/dashboard/exam-repository.test.tsx`

- [ ] **Step 1: Update the test to expect new action labels**

In `exam-repository.test.tsx`, the current test checks for links by exam name. Add a focused test for the new labels. The existing test at line 82-86 checks for "filtros em breve" — we'll handle that in Task 3.

No new test file needed — the existing tests validate rendering. The action labels are visible text, so existing `getByRole("link")` assertions remain valid.

- [ ] **Step 2: Replace hardcoded colors in statusTone map**

```tsx
const statusTone: Record<TeacherExamListItem["statusTone"], string> = {
  default: "border-l-[var(--color-success)]",
  destructive: "border-l-[var(--color-danger)]",
  outline: "border-l-[var(--color-border-strong)]",
  secondary: "border-l-[var(--color-warning)]",
};
```

- [ ] **Step 3: Replace hardcoded hex in getStatusAccent**

```tsx
function getStatusAccent(tone: TeacherExamListItem["statusTone"]) {
  switch (tone) {
    case "default":
      return "var(--color-success)";
    case "destructive":
      return "var(--color-danger)";
    case "outline":
      return "var(--color-text-secondary)";
    case "secondary":
      return "var(--color-warning)";
    default:
      return "var(--color-text-secondary)";
  }
}
```

- [ ] **Step 4: Update getActionLabel with clearer labels**

```tsx
function getActionLabel(exam: TeacherExamListItem) {
  if (exam.status === "completed") {
    return "Ver resultado";
  }

  if (exam.status === "error") {
    return "Ver erro";
  }

  if (exam.status === "awaiting_answers") {
    return "Revisar questões";
  }

  return "Ver progresso";
}
```

- [ ] **Step 5: Add title attribute for absolute date on relative date span**

In the `formatRelativeDate` function area, add a companion function:

```tsx
function formatAbsoluteDate(date: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return date;
  }
}
```

Then update the date span in the JSX:

```tsx
<span className="text-xs text-text-secondary" title={formatAbsoluteDate(exam.updatedAt)}>
  {formatRelativeDate(exam.updatedAt)}
</span>
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run --config vitest.config.mts src/test/features/exams/dashboard/ --reporter verbose`

- [ ] **Step 7: Commit**

```bash
git add src/features/exams/dashboard/components/exam-repository-item.tsx src/test/features/exams/dashboard/exam-repository.test.tsx
git commit -m "refactor(exam-repository-item): migrate to design tokens, improve action labels and date display"
```

---

### Task 3: ExamRepository + DashboardPage — Cleanup

**Files:**
- Modify: `src/features/exams/dashboard/components/exam-repository.tsx`
- Modify: `src/app/(auth)/dashboard/page.tsx`
- Modify: `src/test/features/exams/dashboard/exam-repository.test.tsx`

- [ ] **Step 1: Update test — remove "filtros em breve" assertion**

In `exam-repository.test.tsx`, delete the test block at lines 82-86:

```tsx
// DELETE this entire test:
it("keeps room for future filters without implementing them yet", () => {
  render(<ExamRepository exams={exams} />);

  expect(screen.getByText(/filtros em breve/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Remove filter placeholder and fix grid inline style in ExamRepository**

Replace the entire `exam-repository.tsx`:

```tsx
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

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(18rem, 1fr))" }}>
        {exams.map((exam) => (
          <ExamRepositoryItem key={exam.id} exam={exam} />
        ))}
      </div>
    </section>
  );
}
```

Note: The `gridTemplateColumns` inline style is kept here because `repeat(auto-fill, minmax(18rem, 1fr))` cannot be expressed as a single Tailwind utility without a custom class. This is acceptable.

- [ ] **Step 3: Replace inline style in dashboard page.tsx**

Change line 61 from:

```tsx
<div style={{ display: "grid", gap: "1.5rem" }}>
```

To:

```tsx
<div className="grid gap-6">
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run --config vitest.config.mts src/test/features/exams/dashboard/ --reporter verbose`

- [ ] **Step 5: Commit**

```bash
git add src/features/exams/dashboard/components/exam-repository.tsx src/app/(auth)/dashboard/page.tsx src/test/features/exams/dashboard/exam-repository.test.tsx
git commit -m "refactor(dashboard): remove filter placeholder, replace inline styles with Tailwind"
```

---

### Task 4: ProcessingStatus — Colors, phase messaging, error actions

**Files:**
- Modify: `src/features/exams/results/components/processing-status.tsx`
- Modify: `src/test/features/exams/results/processing-page.test.tsx`

- [ ] **Step 1: Update existing tests for phase messaging**

Replace `processing-page.test.tsx` content:

```tsx
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
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npx vitest run --config vitest.config.mts src/test/features/exams/results/processing-page.test.tsx --reporter verbose`

Expected: FAIL — new assertions don't match old component.

- [ ] **Step 3: Rewrite processing-status.tsx**

```tsx
import Link from "next/link";
import { Button } from "@/design-system/components/button";
import type { ExamStatus } from "@/domains/exams/contracts";

type ProcessingStatusProps = {
  examId: string;
  status: Exclude<ExamStatus, "awaiting_answers">;
  errorMessage: string | null;
  progress: {
    total: number;
    completed: number;
    questionsCount: number;
  };
};

const phaseMessages: Record<string, { title: string; description: string }> = {
  uploading: {
    title: "Enviando prova...",
    description: "Fazendo upload do arquivo PDF",
  },
  extracting: {
    title: "Extraindo questões...",
    description: "Lendo e interpretando o conteúdo da prova",
  },
  analyzing_early: {
    title: "Analisando questões...",
    description: "Identificando estrutura e nível de cada questão",
  },
  analyzing_adapting: {
    title: "Adaptando questões...",
    description: "", // filled dynamically with progress
  },
};

export function ProcessingStatus({
  examId,
  status,
  errorMessage,
  progress,
}: ProcessingStatusProps) {
  if (status === "completed") {
    return (
      <section
        aria-labelledby="processing-title"
        className="flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50 p-5"
      >
        <h2 id="processing-title" className="text-lg font-semibold text-green-900">
          Processamento concluído
        </h2>
        <p className="text-sm text-green-700">
          A adaptação da prova foi concluída com sucesso.
        </p>
        <div>
          <Link href={`/exams/${examId}/result`}>
            <Button variant="primary" size="sm">Ver Resultado</Button>
          </Link>
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section
        aria-labelledby="processing-title"
        className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5"
      >
        <h2 id="processing-title" className="text-lg font-semibold text-red-900">
          Erro no processamento
        </h2>
        <p className="text-sm text-red-700">
          {errorMessage ?? "Ocorreu um erro inesperado durante o processamento."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/exams/new">
            <Button variant="primary" size="sm">Criar nova prova</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Voltar ao dashboard</Button>
          </Link>
        </div>
      </section>
    );
  }

  // Processing phases: uploading, extracting, analyzing (early vs adapting)
  const isAdapting = status === "analyzing" && progress.total > 0;
  const phaseKey = isAdapting ? "analyzing_adapting" : status;
  const phase = phaseMessages[phaseKey] ?? phaseMessages.extracting;
  const percent = isAdapting
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <section
      aria-labelledby="processing-title"
      className="flex flex-col gap-4 rounded-2xl border border-border-default bg-white p-5 shadow-soft"
    >
      <h2 id="processing-title" className="text-lg font-semibold text-text-primary">
        {phase.title}
      </h2>
      <p className="text-sm text-text-secondary">
        {isAdapting
          ? `${progress.completed}/${progress.total} adaptações concluídas`
          : phase.description}
      </p>
      <div className="overflow-hidden rounded-xl bg-surface-muted">
        {isAdapting ? (
          <div
            aria-label={`${percent}% concluído`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={percent}
            role="progressbar"
            className="rounded-xl bg-accent-500 px-4 py-3 text-sm font-bold text-white transition-all duration-500"
            style={{ width: `${Math.max(percent, 8)}%` }}
          >
            {percent}% concluído
          </div>
        ) : (
          <div className="h-12 animate-pulse rounded-xl bg-brand-200/60" />
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `npx vitest run --config vitest.config.mts src/test/features/exams/results/processing-page.test.tsx --reporter verbose`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/exams/results/components/processing-status.tsx src/test/features/exams/results/processing-page.test.tsx
git commit -m "refactor(processing-status): migrate colors, add phase messaging and error actions"
```

---

### Task 5: AdaptationResultCard — Migrate emerald, collapsible pedagogical tags

**Files:**
- Modify: `src/features/exams/results/components/adaptation-result-card.tsx`

- [ ] **Step 1: Replace emerald colors in alternatives**

Change the alternatives rendering (lines 70-73):

From:
```tsx
(alt.isCorrect
  ? "bg-emerald-100/60 ring-1 ring-emerald-300/50"
  : "bg-white/60")
```

To:
```tsx
(alt.isCorrect
  ? "bg-green-50 ring-1 ring-green-200"
  : "bg-surface-muted/50")
```

- [ ] **Step 2: Replace emerald in correct answer badge**

Change lines 79-81:

From:
```tsx
(alt.isCorrect
  ? "bg-emerald-600 text-white"
  : "bg-stone-200 text-text-secondary")
```

To:
```tsx
(alt.isCorrect
  ? "bg-green-600 text-white"
  : "bg-surface-muted text-text-secondary")
```

- [ ] **Step 3: Wrap pedagogical tags in a collapsible**

The component needs `"use client"`, `useState`, and `cn` for the collapsible. Add at top of file:

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
```

Then replace the pedagogical tags section (lines 96-132) with:

```tsx
{(adaptation.bnccSkills?.length || adaptation.bloomLevel) ? (
  <PedagogicalDetails
    bnccSkills={adaptation.bnccSkills}
    bloomLevel={adaptation.bloomLevel}
    bnccAnalysis={adaptation.bnccAnalysis}
    bloomAnalysis={adaptation.bloomAnalysis}
  />
) : null}
```

Add a local component at the bottom of the file (before the closing export or after the main component):

```tsx
function PedagogicalDetails({
  bnccSkills,
  bloomLevel,
  bnccAnalysis,
  bloomAnalysis,
}: {
  bnccSkills: string[] | null;
  bloomLevel: string | null;
  bnccAnalysis: string | null;
  bloomAnalysis: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary"
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
        Detalhes pedagógicos
      </button>
      {isOpen ? (
        <div className="flex flex-col gap-2 animate-fade-in">
          <div className="flex flex-wrap gap-2">
            {bnccSkills?.map((skill) => (
              <Badge key={skill} variant="default" size="sm">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {skill}
                </span>
              </Badge>
            ))}
            {bloomLevel ? (
              <Badge variant="success" size="sm">
                <span className="flex items-center gap-1">
                  <BrainCircuit className="h-3 w-3" />
                  {bloomLevel}
                </span>
              </Badge>
            ) : null}
          </div>
          {bnccAnalysis ? (
            <p className="text-xs leading-relaxed text-text-muted">{bnccAnalysis}</p>
          ) : null}
          {bloomAnalysis ? (
            <p className="text-xs leading-relaxed text-text-muted">{bloomAnalysis}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
```

Add `ChevronDown` to the lucide imports at the top of the file.

- [ ] **Step 4: Run tests**

Run: `npx vitest run --config vitest.config.mts src/test/features/exams/results/result-page.test.tsx --reporter verbose`

The test at line 79 checks `screen.getByText(/ef07ma01/i)` — with the collapsible, this will be hidden by default. Update the test to click the collapsible first:

```tsx
it("renders the result hierarchy and BNCC/Bloom context", () => {
  render(<ResultPageView result={result} />);

  expect(screen.getByRole("heading", { name: /matemática/i })).toBeInTheDocument();
  expect(screen.getByText(/frações/i)).toBeInTheDocument();
  expect(screen.getByText(/quanto é metade mais um quarto/i)).toBeInTheDocument();

  // Pedagogical details hidden by default — open collapsible
  fireEvent.click(screen.getByRole("button", { name: /detalhes pedagógicos/i }));
  expect(screen.getByText(/ef07ma01/i)).toBeInTheDocument();
  expect(screen.getByText(/aplicar/i)).toBeInTheDocument();
});
```

Also fix the pre-existing test mismatch in the second test. The component renders "Erro ao adaptar" but the test expects "erro ao adaptar a questão". Change:

From:
```tsx
expect(screen.getByText(/erro ao adaptar a questão/i)).toBeInTheDocument();
```

To:
```tsx
expect(screen.getByText(/erro ao adaptar/i)).toBeInTheDocument();
```

- [ ] **Step 5: Run tests again and confirm pass**

Run: `npx vitest run --config vitest.config.mts src/test/features/exams/results/ --reporter verbose`

- [ ] **Step 6: Commit**

```bash
git add src/features/exams/results/components/adaptation-result-card.tsx src/test/features/exams/results/result-page.test.tsx
git commit -m "refactor(adaptation-result-card): migrate emerald to green, add collapsible pedagogical tags"
```

---

### Task 6: ResultPageView — Stat icons, bulk copy always visible

**Files:**
- Modify: `src/features/exams/results/components/result-page.tsx`

- [ ] **Step 1: Fix stat icon colors**

Change line 140:

From:
```tsx
<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
```

To:
```tsx
<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
```

- [ ] **Step 2: Remove collapsible from bulk copy section**

Replace the entire bulk copy section (lines 161-204) with:

```tsx
{/* ── Bulk Copy per Support ── */}
<section className="rounded-2xl border border-border-default bg-white p-5 shadow-soft">
  <div className="flex flex-col gap-3">
    <div className="flex flex-col gap-0.5">
      <h3 className="text-sm font-semibold text-text-primary">Copiar prova completa</h3>
      <p className="text-xs text-text-muted">Copie todas as questões adaptadas por apoio</p>
    </div>
    <div className="flex flex-wrap gap-2">
      {result.questions[0]?.supports.map((support) => {
        const isCopied = copiedSupportId === support.supportId;
        return (
          <Button
            key={support.supportId}
            variant={isCopied ? "primary" : "outline"}
            size="sm"
            onClick={() => handleCopyAll(support.supportName, support.supportId)}
          >
            {isCopied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {isCopied ? "Copiado!" : support.supportName}
          </Button>
        );
      })}
    </div>
  </div>
</section>
```

- [ ] **Step 3: Remove expandedCopySupport state**

Remove from the component:
- `const [expandedCopySupport, setExpandedCopySupport] = useState<string | null>(null);`
- Remove `ChevronDown` from the lucide imports (if not used elsewhere in the file — check first).

- [ ] **Step 4: Run tests**

Run: `npx vitest run --config vitest.config.mts src/test/features/exams/results/ --reporter verbose`

- [ ] **Step 5: Commit**

```bash
git add src/features/exams/results/components/result-page.tsx
git commit -m "refactor(result-page): fix stat icons to brand tokens, make bulk copy always visible"
```

---

### Task 7: Small fixes — CopyActionBar, FeedbackForm, ExtractionWarningList

**Files:**
- Modify: `src/features/exams/results/components/copy-action-bar.tsx`
- Modify: `src/features/exams/results/components/feedback-form.tsx`
- Modify: `src/features/exams/extraction/components/extraction-warning-list.tsx`

- [ ] **Step 1: CopyActionBar — fix variant logic and remove redundant class**

In `copy-action-bar.tsx`, update the Button's `variant` prop (line 57) to include danger for error state:

From:
```tsx
variant={status === "copied" ? "primary" : "outline"}
```

To:
```tsx
variant={status === "copied" ? "primary" : status === "error" ? "danger" : "outline"}
```

Then remove the redundant `className` override (lines 59-61):

From:
```tsx
className={cn(
  "transition-all duration-200",
  status === "copied" && "bg-brand-600",
)}
```

To:
```tsx
className="transition-all duration-200"
```

- [ ] **Step 2: FeedbackForm — replace stone-300 with text-muted**

In `feedback-form.tsx` line 86, change:

From:
```tsx
: "fill-transparent text-stone-300",
```

To:
```tsx
: "fill-transparent text-text-muted",
```

- [ ] **Step 3: ExtractionWarningList — replace amber-600 with warning token**

In `extraction-warning-list.tsx` line 13, change:

From:
```tsx
className="m-0 list-disc pl-5 text-sm text-amber-600"
```

To:
```tsx
className="m-0 list-disc pl-5 text-sm text-[var(--color-warning)]"
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run --config vitest.config.mts --reporter verbose 2>&1 | tail -20`

- [ ] **Step 5: Commit**

```bash
git add src/features/exams/results/components/copy-action-bar.tsx src/features/exams/results/components/feedback-form.tsx src/features/exams/extraction/components/extraction-warning-list.tsx
git commit -m "refactor: migrate remaining hardcoded colors to design tokens"
```

---

### Task 8: NewExamForm — Required markers, onBlur validation

**Files:**
- Modify: `src/features/exams/create/components/new-exam-form.tsx`

- [ ] **Step 1: Remove inputClass constant**

Remove line 29 (`const inputClass = ...`). The `select` and `textarea` elements cannot use the `Input`/`Textarea` components directly (different HTML elements), so we'll inline the design-system-aligned classes instead.

- [ ] **Step 2: Add required markers to labels**

For Disciplina label (line 155-157), change to:

```tsx
<label htmlFor="subject-id" className="text-sm font-semibold text-text-primary">
  Disciplina <span className="text-danger">*</span>
</label>
```

For Ano/Série label (line 179-181), change to:

```tsx
<label htmlFor="grade-level-id" className="text-sm font-semibold text-text-primary">
  Ano/Série <span className="text-danger">*</span>
</label>
```

For Tema label (line 203-205), change to:

```tsx
<label htmlFor="topic" className="text-sm font-semibold text-text-primary">
  Tema <span className="text-text-muted font-normal">(opcional)</span>
</label>
```

- [ ] **Step 3: Add onBlur validation to selects**

Add `onBlur` handlers to the Disciplina select:

```tsx
onBlur={() => {
  if (!subjectId) {
    setErrors((current) => ({ ...current, subjectId: "Selecione uma disciplina." }));
  }
}}
```

Add `onBlur` to the Ano/Série select:

```tsx
onBlur={() => {
  if (!gradeLevelId) {
    setErrors((current) => ({ ...current, gradeLevelId: "Selecione um ano/série." }));
  }
}}
```

- [ ] **Step 4: Replace select className from inputClass to inline Tailwind**

Since `<select>` can't use the `Input` component (different element), use the Input component's classes directly:

```tsx
className="h-10 w-full rounded-xl border border-border-default bg-white px-3.5 text-sm text-text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 hover:border-border-strong"
```

Apply this to both select elements. For the textarea, replace with the `Textarea` component or use the same pattern.

- [ ] **Step 5: Run tests**

Run: `npx vitest run --config vitest.config.mts src/test/features/exams/create/ --reporter verbose`

- [ ] **Step 6: Commit**

```bash
git add src/features/exams/create/components/new-exam-form.tsx
git commit -m "refactor(new-exam-form): add required markers, onBlur validation, remove duplicated input styles"
```

---

### Task 9: QuestionReviewCard — Replace hardcoded input classes

**Files:**
- Modify: `src/features/exams/extraction/components/question-review-card.tsx`

- [ ] **Step 1: Replace hardcoded input className**

At line 91, change:

From:
```tsx
className="w-full rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
```

To (matching Input component's classes):
```tsx
className="h-10 w-full rounded-xl border border-border-default bg-white px-3.5 text-sm text-text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 hover:border-border-strong"
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run --config vitest.config.mts src/test/features/exams/extraction/ --reporter verbose`

- [ ] **Step 3: Commit**

```bash
git add src/features/exams/extraction/components/question-review-card.tsx
git commit -m "refactor(question-review-card): align input styles with design system"
```

---

### Task 10: ExtractionReview — Progress indicator, FAB, fixed submit banner

**Files:**
- Modify: `src/features/exams/extraction/components/extraction-review.tsx`
- Modify: `src/test/features/exams/extraction/extraction-review.test.tsx`

- [ ] **Step 1: Add test for progress indicator**

In `extraction-review.test.tsx`, add to the first test:

```tsx
it("shows progress indicator counting answered questions", () => {
  render(<ExtractionReview examId="exam-1" questions={questions} />);

  expect(screen.getByText(/0 de 2 respondidas/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("radio", { name: /b 4/i }));

  expect(screen.getByText(/1 de 2 respondidas/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Add test for fixed submit banner**

```tsx
it("shows fixed submit banner when all questions are answered", () => {
  render(<ExtractionReview examId="exam-1" questions={questions} />);

  // Answer the objective question
  fireEvent.click(screen.getByRole("radio", { name: /b 4/i }));
  // Fill the essay question
  fireEvent.change(screen.getByLabelText(/resposta esperada da questão 2/i), {
    target: { value: "Evaporação" },
  });

  expect(screen.getByText(/todas as questões revisadas/i)).toBeInTheDocument();
});
```

- [ ] **Step 2b: Add test for FAB with 3+ questions**

Add a third question to test the FAB. Create a local fixture:

```tsx
const threeQuestions = [
  ...questions,
  {
    id: "question-3",
    orderNum: 3,
    content: "Qual a capital do Brasil?",
    questionType: "objective" as const,
    alternatives: [
      { label: "A", text: "São Paulo" },
      { label: "B", text: "Brasília" },
    ],
    visualElements: null,
    extractionWarning: null,
  },
];

it("shows FAB when there are unanswered questions and more than 2 total", () => {
  render(<ExtractionReview examId="exam-1" questions={threeQuestions} />);

  expect(screen.getByRole("button", { name: /próxima questão sem resposta/i })).toBeInTheDocument();

  // Answer all questions — FAB should disappear
  fireEvent.click(screen.getAllByRole("radio", { name: /b/i })[0]);
  fireEvent.change(screen.getByLabelText(/resposta esperada da questão 2/i), {
    target: { value: "Evaporação" },
  });
  fireEvent.click(screen.getAllByRole("radio", { name: /b/i })[1]);

  expect(screen.queryByRole("button", { name: /próxima questão sem resposta/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests to confirm they fail**

Run: `npx vitest run --config vitest.config.mts src/test/features/exams/extraction/extraction-review.test.tsx --reporter verbose`

Expected: FAIL

- [ ] **Step 4: Implement progress indicator, FAB, and fixed submit banner**

Rewrite `extraction-review.tsx`:

```tsx
"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/design-system/components/button";
import { EmptyState } from "@/design-system/components/empty-state";
import { QuestionReviewCard } from "@/features/exams/extraction/components/question-review-card";

type ExtractionReviewProps = Readonly<{
  examId: string;
  questions: Array<{
    id: string;
    orderNum: number;
    content: string;
    questionType: "objective" | "essay";
    alternatives: Array<{ label: string; text: string }> | null;
    visualElements: Array<{ type: string; description: string }> | null;
    extractionWarning: string | null;
  }>;
}>;

export function ExtractionReview({
  examId,
  questions,
}: ExtractionReviewProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v.trim().length > 0).length,
    [answers],
  );

  const allAnswered = answeredCount === questions.length && questions.length > 0;

  const nextUnansweredId = useMemo(() => {
    return questions.find((q) => !answers[q.id]?.trim())?.id ?? null;
  }, [questions, answers]);

  if (questions.length === 0) {
    return <EmptyState message="Nenhuma questão foi extraída para revisão." />;
  }

  async function handleSubmit() {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/exams/${examId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: questions
            .map((question) => ({
              questionId: question.id,
              correctAnswer: answers[question.id] ?? "",
            }))
            .filter((answer) => answer.correctAnswer.trim().length > 0),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Erro ao salvar respostas.");
      }

      toast.success("Respostas salvas. A adaptação foi iniciada.");
      startTransition(() => {
        router.refresh();
        router.push(`/exams/${examId}/processing`);
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar respostas.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function scrollToNextUnanswered() {
    if (nextUnansweredId && questionRefs.current[nextUnansweredId]) {
      questionRefs.current[nextUnansweredId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Info box */}
      <div className="rounded-2xl border border-border-default bg-white p-5">
        <div className="flex flex-col gap-1">
          <strong className="text-base font-semibold text-text-primary">Revisão humana das respostas</strong>
          <p className="text-sm text-text-secondary">
            Confirme a resposta correta de cada questão para liberar a etapa de adaptação.
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-text-secondary">
          {answeredCount} de {questions.length} respondidas
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-300"
            style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      {questions.map((question) => (
        <div
          key={question.id}
          ref={(el) => { questionRefs.current[question.id] = el; }}
        >
          <QuestionReviewCard
            question={question}
            value={answers[question.id] ?? ""}
            disabled={isSubmitting}
            onChange={(nextValue) => {
              setAnswers((current) => ({
                ...current,
                [question.id]: nextValue,
              }));
            }}
          />
        </div>
      ))}

      {/* Bottom submit button (hidden when fixed banner is visible) */}
      {!allAnswered ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="accent"
            size="md"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Salvando revisão" : "Avançar para adaptação"}
          </Button>
        </div>
      ) : null}

      {/* FAB: scroll to next unanswered */}
      {!allAnswered && nextUnansweredId && questions.length > 2 ? (
        <button
          type="button"
          onClick={scrollToNextUnanswered}
          aria-label="Próxima questão sem resposta"
          className="fixed right-6 bottom-6 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white shadow-elevated transition-transform hover:scale-105 active:scale-95"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      ) : null}

      {/* Fixed submit banner */}
      {allAnswered ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-default bg-white shadow-elevated animate-slide-up">
          <div className="container-page flex items-center justify-between py-3">
            <p className="text-sm font-medium text-text-primary">
              Todas as questões revisadas
            </p>
            <Button
              type="button"
              variant="accent"
              size="md"
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Salvando revisão" : "Avançar para adaptação"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run --config vitest.config.mts src/test/features/exams/extraction/extraction-review.test.tsx --reporter verbose`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/exams/extraction/components/extraction-review.tsx src/test/features/exams/extraction/extraction-review.test.tsx
git commit -m "feat(extraction-review): add progress indicator, FAB scroll, fixed submit banner"
```

---

### Task 11: Final verification — full test suite

- [ ] **Step 1: Run the complete test suite**

Run: `npx vitest run --config vitest.config.mts --reporter verbose 2>&1 | tail -30`

All tests should pass. Fix any regressions found.

- [ ] **Step 2: Delete .next/ cache and verify dev server starts**

Run: `rm -rf .next && npx next dev --turbopack`

Visually check dashboard, processing, result, extraction, and new exam pages.

- [ ] **Step 3: Commit any remaining fixes**

```bash
git add -A
git commit -m "fix: address test regressions from dashboard redesign"
```

Only create this commit if there are actual fixes needed. If tests passed cleanly in step 1, skip this.
