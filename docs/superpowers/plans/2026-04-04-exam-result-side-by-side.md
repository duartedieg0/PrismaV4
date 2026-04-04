# Exam Result Side-by-Side Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the exam result page so the original question content and adapted content display side by side (desktop) or stacked (mobile), replacing the current collapsible original content.

**Architecture:** Extract `PedagogicalDetails` into its own file. Rewrite `QuestionResult` to use a CSS grid layout with two panels. Remove `PedagogicalDetails` rendering from `AdaptationResultCard`. Update existing tests to match the new always-visible original content and relocated pedagogical details.

**Tech Stack:** React, Tailwind CSS, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-04-04-exam-result-side-by-side-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/features/exams/results/components/pedagogical-details.tsx` | Standalone collapsible pedagogical details component |
| Modify | `src/features/exams/results/components/adaptation-result-card.tsx` | Remove `PedagogicalDetails` rendering and its private function |
| Modify | `src/features/exams/results/components/question-result.tsx` | New grid layout with original panel, adapted panel, and pedagogical details below |
| Modify | `src/test/features/exams/results/result-page.test.tsx` | Update tests for always-visible original content and relocated pedagogical details |
| Modify | `src/test/features/exams/results/result-page.a11y.test.tsx` | Verify a11y still passes with new layout |

---

### Task 1: Extract `PedagogicalDetails` to its own file

**Files:**
- Create: `src/features/exams/results/components/pedagogical-details.tsx`
- Modify: `src/features/exams/results/components/adaptation-result-card.tsx` (lines 131-189 — remove private `PedagogicalDetails` function)

- [ ] **Step 1: Create `pedagogical-details.tsx`**

Copy the existing `PedagogicalDetails` function from `adaptation-result-card.tsx` (lines 131-189) into a new file. Make it a named export. It needs `"use client"` because it uses `useState`. Keep all existing imports it needs (`useState`, `cn`, `ChevronDown`, `BookOpen`, `BrainCircuit`, `Badge`).

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, BookOpen, BrainCircuit } from "lucide-react";
import { Badge } from "@/design-system/components/badge";

type PedagogicalDetailsProps = {
  bnccSkills: string[] | null;
  bloomLevel: string | null;
  bnccAnalysis: string | null;
  bloomAnalysis: string | null;
};

export function PedagogicalDetails({
  bnccSkills,
  bloomLevel,
  bnccAnalysis,
  bloomAnalysis,
}: PedagogicalDetailsProps) {
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

- [ ] **Step 2: Update `adaptation-result-card.tsx` — import from new file and remove private function**

In `adaptation-result-card.tsx`:
1. Add import: `import { PedagogicalDetails } from "@/features/exams/results/components/pedagogical-details";`
2. Remove the private `PedagogicalDetails` function (lines 131-189)
3. Remove now-unused imports: `ChevronDown`, `BookOpen`, `BrainCircuit` from lucide-react, and `Badge` (check if Badge is used elsewhere in the file first — it is not, so remove it). Also remove `cn` import since it's no longer used in this file. Keep `useState` since it's not used anymore either — actually `useState` is not used in `AdaptationResultCard` directly, only in the removed `PedagogicalDetails`. But wait — let's check: `AdaptationResultCard` does not use `useState`. Remove it.

Updated imports for `adaptation-result-card.tsx`:
```tsx
"use client";

import {
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { CopyActionBar } from "@/features/exams/results/components/copy-action-bar";
import { FeedbackForm } from "@/features/exams/results/components/feedback-form";
import { PedagogicalDetails } from "@/features/exams/results/components/pedagogical-details";
import type { AdaptationResultView } from "@/features/exams/results/contracts";
```

The component body (lines 23-129) stays the same — it still renders `PedagogicalDetails` inline for now. We'll remove it in Task 3.

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Run existing tests**

Run: `npx vitest run src/test/features/exams/results/`
Expected: All tests pass (behavior unchanged — `PedagogicalDetails` is still rendered in the same place, just imported from a different file)

- [ ] **Step 5: Commit**

```bash
git add src/features/exams/results/components/pedagogical-details.tsx src/features/exams/results/components/adaptation-result-card.tsx
git commit -m "refactor: extract PedagogicalDetails to own file"
```

---

### Task 2: Remove `PedagogicalDetails` from `AdaptationResultCard` AND rewrite `QuestionResult`

> **Note:** These two changes are combined in a single task because removing `PedagogicalDetails` from `AdaptationResultCard` without simultaneously re-adding it in `QuestionResult` would create a broken intermediate state (existing tests would fail).

**Files:**
- Modify: `src/features/exams/results/components/adaptation-result-card.tsx` (lines 100-108 — remove pedagogical details rendering)
- Modify: `src/features/exams/results/components/question-result.tsx`

- [ ] **Step 1: Remove `PedagogicalDetails` rendering from `AdaptationResultCard`**

In `adaptation-result-card.tsx`, remove the entire pedagogical section (the conditional block that renders `PedagogicalDetails`, around lines 100-108):

```tsx
      {/* ── Pedagogical Tags ── */}
      {(adaptation.bnccSkills?.length || adaptation.bloomLevel) ? (
        <PedagogicalDetails
          bnccSkills={adaptation.bnccSkills}
          bloomLevel={adaptation.bloomLevel}
          bnccAnalysis={adaptation.bnccAnalysis}
          bloomAnalysis={adaptation.bloomAnalysis}
        />
      ) : null}
```

Also remove the now-unused import of `PedagogicalDetails`.

- [ ] **Step 2: Rewrite `QuestionResult` with side-by-side grid layout** (see Task 3 below for full code)

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/features/exams/results/components/adaptation-result-card.tsx src/features/exams/results/components/question-result.tsx
git commit -m "feat: side-by-side layout with PedagogicalDetails relocated below grid"
```

---

### Task 2 Appendix: `QuestionResult` full code (used in Task 2 Step 2)

**Files:**
- Modify: `src/features/exams/results/components/question-result.tsx`

- [ ] **Step 1: Rewrite `QuestionResult`**

Replace the entire content of `question-result.tsx` with the new layout. Key changes:
- Remove `showOriginal` state, the collapsible button, and `ChevronDown` import
- Add import for `PedagogicalDetails`
- Keep `selectedSupportId` state and `selectedAdaptation` derived value
- New structure: header → grid(original panel | adapted panel) → pedagogical details

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { Badge } from "@/design-system/components/badge";
import { AdaptationResultCard } from "@/features/exams/results/components/adaptation-result-card";
import { PedagogicalDetails } from "@/features/exams/results/components/pedagogical-details";
import type { QuestionResultView } from "@/features/exams/results/contracts";

type QuestionResultProps = {
  examId: string;
  question: QuestionResultView;
  onCopy?: (text: string) => Promise<void> | void;
};

export function QuestionResult({ examId, question, onCopy }: QuestionResultProps) {
  const [selectedSupportId, setSelectedSupportId] = useState(
    question.supports[0]?.supportId ?? "",
  );

  const selectedAdaptation =
    question.supports.find((support) => support.supportId === selectedSupportId) ??
    question.supports[0];

  const hasSupports = question.supports.length > 0;

  return (
    <section
      aria-labelledby={`question-${question.questionId}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-border-default bg-white shadow-soft"
    >
      {/* ── Question Header ── */}
      <div className="flex items-center gap-4 border-b border-border-default bg-surface-muted/40 p-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-soft">
          {question.orderNum}
        </span>
        <h3
          id={`question-${question.questionId}`}
          className="text-base font-semibold text-text-primary"
        >
          Questão {question.orderNum}
        </h3>
        <Badge
          variant={question.questionType === "objective" ? "info" : "warning"}
          size="sm"
        >
          {question.questionType === "objective" ? "Objetiva" : "Dissertativa"}
        </Badge>
      </div>

      {/* ── Side-by-Side Grid ── */}
      <div className={cn(
        "grid items-start gap-4 p-5 md:gap-5",
        hasSupports ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
      )}>
        {/* ── Left Panel: Original Content ── */}
        <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-border-default">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-text-muted" />
            <h4 className="text-sm font-semibold text-text-primary">
              Enunciado original
            </h4>
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            {question.originalContent}
          </p>
          {question.originalAlternatives && question.originalAlternatives.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {question.originalAlternatives.map((alt) => (
                <li key={alt.label} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-xs font-bold text-text-secondary">
                    {alt.label}
                  </span>
                  <span>{alt.text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* ── Right Panel: Adapted Content ── */}
        {hasSupports ? (
          <div className="flex flex-col overflow-hidden rounded-xl ring-1 ring-brand-200/50">
            {/* Support Tabs */}
            <div className="border-b border-brand-200/50 px-4 pt-3 pb-0">
              <div
                aria-label={`Apoios da questão ${question.orderNum}`}
                role="tablist"
                className="flex gap-1"
              >
                {question.supports.map((support) => {
                  const isSelected = support.supportId === selectedSupportId;
                  const hasError = support.status === "error";

                  return (
                    <button
                      aria-selected={isSelected}
                      key={support.supportId}
                      onClick={() => setSelectedSupportId(support.supportId)}
                      role="tab"
                      type="button"
                      className={cn(
                        "relative px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                        "rounded-t-lg",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
                        isSelected
                          ? "bg-brand-50/50 text-brand-700"
                          : "text-text-muted hover:bg-surface-muted hover:text-text-secondary",
                        hasError && "text-danger",
                      )}
                    >
                      {support.supportName}
                      {isSelected ? (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-600" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Adaptation Content */}
            <div className="bg-brand-50/50 p-4">
              {selectedAdaptation ? (
                <AdaptationResultCard
                  adaptation={selectedAdaptation}
                  examId={examId}
                  onCopy={onCopy}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-muted">Nenhuma adaptação disponível.</p>
        )}
      </div>

      {/* ── Pedagogical Details (full-width below grid) ── */}
      {selectedAdaptation &&
        (selectedAdaptation.bnccSkills?.length || selectedAdaptation.bloomLevel) ? (
        <div className="border-t border-border-default px-5 py-4">
          <PedagogicalDetails
            bnccSkills={selectedAdaptation.bnccSkills}
            bloomLevel={selectedAdaptation.bloomLevel}
            bnccAnalysis={selectedAdaptation.bnccAnalysis}
            bloomAnalysis={selectedAdaptation.bloomAnalysis}
          />
        </div>
      ) : null}
    </section>
  );
}
```

> **Note:** This task has no separate commit — the code is committed together with `AdaptationResultCard` changes in Task 2 Step 4.

---

### Task 3: Update tests

**Files:**
- Modify: `src/test/features/exams/results/result-page.test.tsx`
- Modify: `src/test/features/exams/results/result-page.a11y.test.tsx`

- [ ] **Step 1: Update `result-page.test.tsx`**

The test at line 74 currently expects the original content to be hidden by default and the pedagogical details to be inside the adaptation card. Changes needed:

1. The test "renders the result hierarchy and BNCC/Bloom context" (line 74): The original content is now always visible, so `screen.getByText("Quanto é 1/2 + 1/4?")` should be findable without any interaction. The original alternatives should also be visible. The pedagogical details collapsible button still exists (just relocated), so the `fireEvent.click` for "detalhes pedagógicos" still works.

2. Add a new test to verify original content and alternatives are always visible.

3. Add a test for the zero-supports edge case.

Updated test file:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResultPageView } from "@/features/exams/results/components/result-page";
import type { ExamResultView } from "@/features/exams/results/contracts";

const result: ExamResultView = {
  examId: "exam-1",
  examStatus: "completed",
  subjectName: "Matemática",
  gradeLevelName: "7º ano",
  topicName: "Frações",
  supportNames: ["Dislexia", "TDAH"],
  createdAt: "2026-03-21T12:00:00.000Z",
  questions: [
    {
      questionId: "question-1",
      orderNum: 1,
      questionType: "objective",
      originalContent: "Quanto é 1/2 + 1/4?",
      originalAlternatives: [
        { label: "A", text: "1/3" },
        { label: "B", text: "3/4" },
      ],
      supports: [
        {
          adaptationId: "adaptation-1",
          supportId: "support-1",
          supportName: "Dislexia",
          status: "completed",
          adaptedContent: "Quanto é metade mais um quarto?",
          adaptedAlternatives: null,
          bnccSkills: ["EF07MA01"],
          bloomLevel: "Aplicar",
          bnccAnalysis: "Análise BNCC",
          bloomAnalysis: "Análise Bloom",
          copyBlock: {
            type: "objective",
            text: "Quanto é metade mais um quarto?",
          },
          feedback: null,
        },
        {
          adaptationId: "adaptation-2",
          supportId: "support-2",
          supportName: "TDAH",
          status: "error",
          adaptedContent: null,
          adaptedAlternatives: null,
          bnccSkills: null,
          bloomLevel: null,
          bnccAnalysis: null,
          bloomAnalysis: null,
          copyBlock: null,
          feedback: null,
        },
      ],
    },
  ],
};

describe("result page view", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "feedback-1", rating: 5, comment: "Ótimo" }),
    }));
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("shows original content and alternatives side by side with adapted content", () => {
    render(<ResultPageView result={result} />);

    // Original content is always visible (no collapsible)
    expect(screen.getByText("Quanto é 1/2 + 1/4?")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
    expect(screen.getByText("3/4")).toBeInTheDocument();

    // Adapted content is also visible
    expect(screen.getByText(/quanto é metade mais um quarto/i)).toBeInTheDocument();
  });

  it("renders the result hierarchy and BNCC/Bloom context", () => {
    render(<ResultPageView result={result} />);

    expect(screen.getByText(/matemática/i)).toBeInTheDocument();
    expect(screen.getByText(/frações/i)).toBeInTheDocument();
    expect(screen.getByText(/quanto é metade mais um quarto/i)).toBeInTheDocument();

    // Pedagogical details hidden by default — open collapsible
    fireEvent.click(screen.getByRole("button", { name: /detalhes pedagógicos/i }));
    expect(screen.getByText(/ef07ma01/i)).toBeInTheDocument();
    expect(screen.getByText(/aplicar/i)).toBeInTheDocument();
  });

  it("no longer renders the collapsible original content button", () => {
    render(<ResultPageView result={result} />);

    expect(
      screen.queryByRole("button", { name: /ver enunciado original/i }),
    ).not.toBeInTheDocument();
  });

  it("switches support tabs and exposes error state per adaptation", () => {
    render(<ResultPageView result={result} />);

    fireEvent.click(screen.getByRole("tab", { name: /tdah/i }));

    expect(screen.getByText(/erro ao adaptar/i)).toBeInTheDocument();
    // Pedagogical details should disappear when error tab has no BNCC/Bloom data
    expect(
      screen.queryByRole("button", { name: /detalhes pedagógicos/i }),
    ).not.toBeInTheDocument();
  });

  it("copies adaptation content and submits feedback", async () => {
    render(<ResultPageView result={result} />);

    fireEvent.click(screen.getByRole("button", { name: /copiar adaptação/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "Quanto é metade mais um quarto?",
    );

    fireEvent.click(screen.getByRole("button", { name: /5 estrelas/i }));
    fireEvent.click(screen.getByRole("button", { name: /adicionar comentário/i }));
    fireEvent.change(screen.getByLabelText(/comentário/i), {
      target: { value: "Muito bom." },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar feedback/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/exams/exam-1/feedback",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  it("shows empty state when question has zero supports", () => {
    const noSupportsResult: ExamResultView = {
      ...result,
      questions: [
        {
          questionId: "question-no-supports",
          orderNum: 1,
          questionType: "essay",
          originalContent: "Explique frações.",
          originalAlternatives: null,
          supports: [],
        },
      ],
    };

    render(<ResultPageView result={noSupportsResult} />);

    expect(screen.getByText("Explique frações.")).toBeInTheDocument();
    expect(screen.getByText(/nenhuma adaptação disponível/i)).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/test/features/exams/results/result-page.test.tsx`
Expected: All 6 tests pass

- [ ] **Step 3: Run a11y test**

Run: `npx vitest run src/test/features/exams/results/result-page.a11y.test.tsx`
Expected: Test passes (no a11y violations — the a11y test does not need code changes since it renders the same data, just in a different layout)

- [ ] **Step 4: Run full test suite for the results feature**

Run: `npx vitest run src/test/features/exams/results/`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/test/features/exams/results/result-page.test.tsx
git commit -m "test: update result page tests for side-by-side layout"
```

---

### Task 4: Visual smoke test

- [ ] **Step 1: Start dev server and verify layout**

Run: `npm run dev`

Open `http://localhost:3000` and navigate to an exam result page. Verify:
1. Header shows question number and type badge
2. Original content panel (left on desktop) shows enunciado and alternatives
3. Adapted content panel (right on desktop) shows tabs and adapted content
4. Pedagogical details appear below both panels
5. On narrow viewport (< 768px), panels stack vertically: original on top, adapted below
6. Tab switching works and updates both the adaptation content and pedagogical details
7. Copy and feedback still work inside the adapted panel

- [ ] **Step 2: Commit any fixes if needed**

If visual issues are found, fix them and commit:
```bash
git add -u
git commit -m "fix: visual adjustments for side-by-side layout"
```
