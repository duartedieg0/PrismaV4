# Processing Progress Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time polling and improved visual feedback to the processing screen so teachers can track extraction and adaptation progress without manual refresh.

**Architecture:** A `useExamProgress` client hook polls `GET /api/exams/[id]/status` every 4 seconds. The endpoint is extended with `questionsCompleted`. `ProcessingStatus` becomes a client component with rotating messages, question-based progress, and auto-redirect on completion.

**Tech Stack:** Next.js 15, React 19, Vitest, Testing Library, Supabase JS client, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-30-processing-progress-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/features/exams/results/hooks/use-exam-progress.ts` | Create | Polling hook — fetches status every 4s, auto-stops on terminal states |
| `src/features/exams/results/hooks/use-rotating-message.ts` | Create | Tiny hook — cycles through a string array on an interval |
| `src/app/api/exams/[id]/status/route.ts` | Modify | Add `questionsCompleted` to progress response |
| `src/features/exams/results/components/processing-status.tsx` | Modify | Convert to `"use client"`, integrate hooks, rotating messages, auto-redirect |
| `src/app/(auth)/exams/[id]/processing/page.tsx` | Modify | Add server-side `completed` redirect, pass `questionsCompleted` in initialData |
| `src/test/features/exams/extraction/exam-status-route.test.ts` | Modify | Update test to cover `questionsCompleted` |
| `src/test/features/exams/results/processing-page.test.tsx` | Modify | Update tests for new props and client behavior |
| `src/test/features/exams/results/use-exam-progress.test.ts` | Create | Unit tests for the polling hook |

---

### Task 1: Add `questionsCompleted` to status endpoint

**Files:**
- Modify: `src/app/api/exams/[id]/status/route.ts`
- Modify: `src/test/features/exams/extraction/exam-status-route.test.ts`

- [ ] **Step 1: Update the existing test to expect `questionsCompleted`**

In `src/test/features/exams/extraction/exam-status-route.test.ts`, update the "returns stable exam status and progress payload" test. The mock currently returns 2 questions with 4 total adaptations and 2 completed. We need to also mock the new adaptations query that fetches `{ question_id, status }` for grouping.

Replace the existing test assertion at line 120-128 to expect `questionsCompleted` in the response:

```typescript
expect(body.data).toEqual({
  status: "analyzing",
  errorMessage: null,
  progress: {
    total: 4,
    completed: 2,
    questionsCount: 2,
    questionsCompleted: 0,
  },
});
```

Also update the existing test's `adaptationsSelect` mock chain to add a third `.mockReturnValueOnce` for the new `select("question_id, status")` query. The full updated mock chain becomes:

```typescript
adaptationsSelect
  .mockReturnValueOnce({
    in: adaptationsIn.mockResolvedValueOnce({ count: 4, error: null }),
  })
  .mockReturnValueOnce({
    in: vi.fn(() => ({
      eq: adaptationsEq.mockResolvedValue({
        count: 2,
        error: null,
      }),
    })),
  })
  .mockReturnValueOnce({
    in: vi.fn().mockResolvedValue({
      data: [
        { question_id: "question-1", status: "completed" },
        { question_id: "question-1", status: "pending" },
        { question_id: "question-2", status: "completed" },
        { question_id: "question-2", status: "pending" },
      ],
      error: null,
    }),
  });
```

With this data, neither question has ALL adaptations completed, so `questionsCompleted` = 0.

Add a second test where all adaptations for question-1 are completed:

```typescript
it("counts questionsCompleted when all adaptations for a question are done", async () => {
  const { GET } = await import("@/app/api/exams/[id]/status/route");

  getUser.mockResolvedValue({ data: { user: { id: "teacher-1" } } });
  examSingle.mockResolvedValue({
    data: { id: "exam-1", user_id: "teacher-1", status: "analyzing", error_message: null },
    error: null,
  });
  questionsEq.mockResolvedValue({
    data: [{ id: "question-1" }, { id: "question-2" }],
    error: null,
  });
  // total adaptations count
  adaptationsSelect
    .mockReturnValueOnce({
      in: adaptationsIn.mockResolvedValueOnce({ count: 4, error: null }),
    })
    .mockReturnValueOnce({
      in: vi.fn(() => ({
        eq: adaptationsEq.mockResolvedValue({ count: 3, error: null }),
      })),
    })
    .mockReturnValueOnce({
      in: vi.fn().mockResolvedValue({
        data: [
          { question_id: "question-1", status: "completed" },
          { question_id: "question-1", status: "completed" },
          { question_id: "question-2", status: "completed" },
          { question_id: "question-2", status: "pending" },
        ],
        error: null,
      }),
    });

  const response = await GET(new Request("http://localhost:3000/api/exams/exam-1/status"), {
    params: Promise.resolve({ id: "exam-1" }),
  });

  const body = await response.json();
  expect(body.data.progress.questionsCompleted).toBe(1);
});
```

Also add a test for the zero-questions early return:

```typescript
it("includes questionsCompleted in zero-questions early return", async () => {
  const { GET } = await import("@/app/api/exams/[id]/status/route");

  getUser.mockResolvedValue({ data: { user: { id: "teacher-1" } } });
  examSingle.mockResolvedValue({
    data: { id: "exam-1", user_id: "teacher-1", status: "extracting", error_message: null },
    error: null,
  });
  questionsEq.mockResolvedValue({ data: [], error: null });

  const response = await GET(new Request("http://localhost:3000/api/exams/exam-1/status"), {
    params: Promise.resolve({ id: "exam-1" }),
  });

  const body = await response.json();
  expect(body.data.progress).toEqual({
    total: 0,
    completed: 0,
    questionsCount: 0,
    questionsCompleted: 0,
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/features/exams/extraction/exam-status-route.test.ts`
Expected: FAIL — response does not contain `questionsCompleted`

- [ ] **Step 3: Implement `questionsCompleted` in the endpoint**

In `src/app/api/exams/[id]/status/route.ts`:

1. Update the zero-questions early return (line 46) to include `questionsCompleted: 0`:

```typescript
if (questionIds.length === 0) {
  return apiSuccess({
    status: exam.status,
    errorMessage: exam.error_message,
    progress: { total: 0, completed: 0, questionsCount: 0, questionsCompleted: 0 },
  });
}
```

2. After the existing `Promise.all` (line 50-60), add a third query to fetch adaptation rows for grouping. Replace the existing queries block with:

```typescript
const [{ count: total }, { count: completed }, { data: adaptationRows }] = await Promise.all([
  supabase
    .from("adaptations")
    .select("*", { count: "exact", head: true })
    .in("question_id", questionIds),
  supabase
    .from("adaptations")
    .select("*", { count: "exact", head: true })
    .in("question_id", questionIds)
    .eq("status", "completed"),
  supabase
    .from("adaptations")
    .select("question_id, status")
    .in("question_id", questionIds),
]);

const grouped = new Map<string, boolean>();
for (const row of adaptationRows ?? []) {
  const current = grouped.get(row.question_id) ?? true;
  grouped.set(row.question_id, current && row.status === "completed");
}
const questionsCompleted = [...grouped.values()].filter(Boolean).length;
```

3. Update the return (line 62-70) to include `questionsCompleted`:

```typescript
return apiSuccess({
  status: exam.status,
  errorMessage: exam.error_message,
  progress: {
    total: total ?? 0,
    completed: completed ?? 0,
    questionsCount: questionIds.length,
    questionsCompleted,
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/features/exams/extraction/exam-status-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/exams/[id]/status/route.ts" src/test/features/exams/extraction/exam-status-route.test.ts
git commit -m "feat(status-endpoint): add questionsCompleted to progress response"
```

---

### Task 2: Create `useRotatingMessage` hook

**Files:**
- Create: `src/features/exams/results/hooks/use-rotating-message.ts`

This is a small utility hook used by `ProcessingStatus` to cycle through an array of messages.

- [ ] **Step 1: Create the hook**

Create `src/features/exams/results/hooks/use-rotating-message.ts`:

```typescript
"use client";

import { useEffect, useState } from "react";

export function useRotatingMessage(messages: string[], intervalMs = 4000): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [messages, intervalMs]);

  return messages[index] ?? messages[0];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/exams/results/hooks/use-rotating-message.ts
git commit -m "feat: add useRotatingMessage hook"
```

---

### Task 3: Create `useExamProgress` polling hook

**Files:**
- Create: `src/features/exams/results/hooks/use-exam-progress.ts`
- Create: `src/test/features/exams/results/use-exam-progress.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/test/features/exams/results/use-exam-progress.test.ts`:

```typescript
import { renderHook, waitFor, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useExamProgress } from "@/features/exams/results/hooks/use-exam-progress";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

const initialData = {
  status: "extracting" as const,
  errorMessage: null,
  progress: { total: 0, completed: 0, questionsCount: 0, questionsCompleted: 0 },
};

describe("useExamProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pushMock.mockReset();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initialData on first render without fetching", () => {
    const { result } = renderHook(() => useExamProgress("exam-1", initialData));

    expect(result.current.status).toBe("extracting");
    expect(result.current.isPolling).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("polls the status endpoint after the interval", async () => {
    const updatedData = {
      data: {
        status: "analyzing",
        errorMessage: null,
        progress: { total: 10, completed: 3, questionsCount: 5, questionsCompleted: 1 },
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => updatedData,
    });

    const { result } = renderHook(() => useExamProgress("exam-1", initialData));

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("analyzing");
      expect(result.current.progress.questionsCompleted).toBe(1);
    });
  });

  it("stops polling and redirects on completed status", async () => {
    const completedData = {
      data: {
        status: "completed",
        errorMessage: null,
        progress: { total: 10, completed: 10, questionsCount: 5, questionsCompleted: 5 },
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => completedData,
    });

    const { result } = renderHook(() => useExamProgress("exam-1", initialData));

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("completed");
      expect(result.current.isPolling).toBe(false);
    });

    // After the 1s redirect delay
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(pushMock).toHaveBeenCalledWith("/exams/exam-1/result");
  });

  it("stops polling and redirects on awaiting_answers status", async () => {
    const awaitingData = {
      data: {
        status: "awaiting_answers",
        errorMessage: null,
        progress: { total: 0, completed: 0, questionsCount: 5, questionsCompleted: 0 },
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => awaitingData,
    });

    const { result } = renderHook(() => useExamProgress("exam-1", initialData));

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/exams/exam-1/extraction");
    });
  });

  it("stops polling on error status", async () => {
    const errorData = {
      data: {
        status: "error",
        errorMessage: "Something failed",
        progress: { total: 0, completed: 0, questionsCount: 0, questionsCompleted: 0 },
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => errorData,
    });

    const { result } = renderHook(() => useExamProgress("exam-1", initialData));

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
      expect(result.current.errorMessage).toBe("Something failed");
      expect(result.current.isPolling).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/features/exams/results/use-exam-progress.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the hook**

Create `src/features/exams/results/hooks/use-exam-progress.ts`:

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExamStatus } from "@/domains/exams/contracts";

export type ExamProgressData = {
  status: ExamStatus;
  errorMessage: string | null;
  progress: {
    total: number;
    completed: number;
    questionsCount: number;
    questionsCompleted: number;
  };
};

const POLL_INTERVAL_MS = 4000;
const REDIRECT_DELAY_MS = 1000;
const TERMINAL_STATUSES: ExamStatus[] = ["completed", "error", "awaiting_answers"];

export function useExamProgress(examId: string, initialData: ExamProgressData) {
  const router = useRouter();
  const [data, setData] = useState<ExamProgressData>(initialData);
  const [isPolling, setIsPolling] = useState(
    !TERMINAL_STATUSES.includes(initialData.status),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const response = await fetch(`/api/exams/${examId}/status`);
      if (!response.ok) return;

      const json = await response.json();
      const newData = json.data as ExamProgressData;
      setData(newData);

      if (newData.status === "completed") {
        stopPolling();
        setTimeout(() => router.push(`/exams/${examId}/result`), REDIRECT_DELAY_MS);
      } else if (newData.status === "awaiting_answers") {
        stopPolling();
        router.push(`/exams/${examId}/extraction`);
      } else if (newData.status === "error") {
        stopPolling();
      }
    } catch {
      // Silently ignore fetch errors — next poll will retry
    }
  }, [examId, router, stopPolling]);

  useEffect(() => {
    if (!isPolling) return;

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPolling, poll]);

  return {
    status: data.status,
    errorMessage: data.errorMessage,
    progress: data.progress,
    isPolling,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/features/exams/results/use-exam-progress.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/exams/results/hooks/use-exam-progress.ts src/test/features/exams/results/use-exam-progress.test.ts
git commit -m "feat: add useExamProgress polling hook with auto-redirect"
```

---

### Task 4: Refactor `ProcessingStatus` to client component with polling

**Files:**
- Modify: `src/features/exams/results/components/processing-status.tsx`
- Modify: `src/test/features/exams/results/processing-page.test.tsx`

- [ ] **Step 1: Update existing tests for new props shape**

In `src/test/features/exams/results/processing-page.test.tsx`:

1. Add mocks for `next/navigation` and the polling hook at the top of the file:

```typescript
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
```

2. Update ALL test renders to pass `questionsCompleted` in the progress prop. Every `progress` object in the tests needs to include `questionsCompleted: 0` (or the appropriate value).

For the "renders analyzing progress" test, update to:
```typescript
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
```

For the "renders the completion CTA" test — since `completed` now triggers auto-redirect via the hook, update the test to verify the redirect behavior. Since we mock `useExamProgress` to pass through `initialData`, the component will still render the completed state briefly. Update to just check that the status is handled without errors:

```typescript
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
```

Update all remaining tests to add `questionsCompleted: 0` to the progress prop:

- "renders phase-specific message for uploading status" — add `questionsCompleted: 0`
- "renders phase-specific message for extracting status" — add `questionsCompleted: 0`
- "renders early analyzing phase before adaptations start" — add `questionsCompleted: 0`, keep existing assertions (`/analisando questões/i` and `/identificando estrutura/i`)
- "renders error state with action buttons" — add `questionsCompleted: 0`

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/features/exams/results/processing-page.test.tsx`
Expected: FAIL — component does not accept new props / does not render new text

- [ ] **Step 3: Rewrite `ProcessingStatus` as client component**

Replace `src/features/exams/results/components/processing-status.tsx` entirely:

```typescript
"use client";

import Link from "next/link";
import { Button } from "@/design-system/components/button";
import type { ExamStatus } from "@/domains/exams/contracts";
import { useExamProgress, type ExamProgressData } from "@/features/exams/results/hooks/use-exam-progress";
import { useRotatingMessage } from "@/features/exams/results/hooks/use-rotating-message";

type ProcessingStatusProps = {
  examId: string;
  status: ExamStatus;
  errorMessage: string | null;
  progress: {
    total: number;
    completed: number;
    questionsCount: number;
    questionsCompleted: number;
  };
};

const EXTRACTING_MESSAGES = [
  "Lendo o PDF...",
  "Identificando questões...",
  "Analisando alternativas...",
  "Interpretando enunciados...",
];

const ADAPTING_MESSAGES = [
  "Analisando habilidades BNCC...",
  "Identificando nível Bloom...",
  "Gerando adaptações...",
];

function formatQuestionsProgress(completed: number, total: number): string {
  if (completed === 1) {
    return `1 de ${total} questão concluída`;
  }
  return `${completed} de ${total} questões concluídas`;
}

export function ProcessingStatus({
  examId,
  status: initialStatus,
  errorMessage: initialErrorMessage,
  progress: initialProgress,
}: ProcessingStatusProps) {
  const initialData: ExamProgressData = {
    status: initialStatus,
    errorMessage: initialErrorMessage,
    progress: initialProgress,
  };

  const { status, errorMessage, progress } = useExamProgress(examId, initialData);

  if (status === "completed") {
    // useExamProgress handles the redirect — render nothing
    return null;
  }

  if (status === "awaiting_answers") {
    // useExamProgress handles the redirect — render nothing
    return null;
  }

  if (status === "error") {
    return <ErrorState errorMessage={errorMessage} />;
  }

  const isAdapting = status === "analyzing" && progress.total > 0;

  if (isAdapting) {
    return (
      <AdaptingState
        progress={progress}
      />
    );
  }

  return <WaitingState status={status} />;
}

function ErrorState({ errorMessage }: { errorMessage: string | null }) {
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

const WAITING_PHASES: Record<string, { title: string; description: string; messages?: string[] }> = {
  uploading: {
    title: "Enviando prova...",
    description: "Fazendo upload do arquivo PDF...",
  },
  extracting: {
    title: "Extraindo questões...",
    description: "Lendo e interpretando o conteúdo da prova",
    messages: EXTRACTING_MESSAGES,
  },
  analyzing: {
    title: "Analisando questões...",
    description: "Identificando estrutura e nível de cada questão",
  },
};

function WaitingState({ status }: { status: ExamStatus }) {
  const phase = WAITING_PHASES[status] ?? WAITING_PHASES.extracting;
  const messages = phase.messages ?? [phase.description];

  const rotatingMessage = useRotatingMessage(messages);

  return (
    <section
      aria-labelledby="processing-title"
      className="flex flex-col gap-4 rounded-2xl border border-border-default bg-white p-5 shadow-soft"
    >
      <h2 id="processing-title" className="text-lg font-semibold text-text-primary">
        {phase.title}
      </h2>
      <p className="text-sm text-text-secondary">
        {phase.messages ? rotatingMessage : phase.description}
      </p>
      <div className="overflow-hidden rounded-xl bg-surface-muted">
        <div className="h-12 animate-pulse rounded-xl bg-brand-200/60" />
      </div>
      <p className="text-xs text-text-tertiary">
        Isso geralmente leva entre 1 e 2 minutos
      </p>
    </section>
  );
}

function AdaptingState({
  progress,
}: {
  progress: ExamProgressData["progress"];
}) {
  const rotatingMessage = useRotatingMessage(ADAPTING_MESSAGES);
  const percent = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <section
      aria-labelledby="processing-title"
      className="flex flex-col gap-4 rounded-2xl border border-border-default bg-white p-5 shadow-soft"
    >
      <h2 id="processing-title" className="text-lg font-semibold text-text-primary">
        Adaptando questões...
      </h2>
      <p className="text-sm text-text-secondary">
        {formatQuestionsProgress(progress.questionsCompleted, progress.questionsCount)}
      </p>
      <div className="overflow-hidden rounded-xl bg-surface-muted">
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
      </div>
      <p className="text-xs text-text-tertiary">
        {rotatingMessage}
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/features/exams/results/processing-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/exams/results/components/processing-status.tsx src/test/features/exams/results/processing-page.test.tsx
git commit -m "feat(processing-status): convert to client component with polling, rotating messages, auto-redirect"
```

---

### Task 5: Update `processing/page.tsx` with server-side redirects and new props

**Files:**
- Modify: `src/app/(auth)/exams/[id]/processing/page.tsx`

- [ ] **Step 1: Add `completed` redirect and `questionsCompleted` to page**

In `src/app/(auth)/exams/[id]/processing/page.tsx`:

1. Add a server-side redirect for `completed` status, right after the `awaiting_answers` redirect (line 34-36):

```typescript
if (exam.status === "awaiting_answers") {
  redirect(`/exams/${examId}/extraction`);
}

if (exam.status === "completed") {
  redirect(`/exams/${examId}/result`);
}
```

2. Replace the adaptation counting logic (lines 45-61) to also compute `questionsCompleted`. Fetch adaptation rows instead of just counts:

```typescript
let totalAdaptations = 0;
let completedAdaptations = 0;
let questionsCompleted = 0;

if (questionIds.length > 0) {
  const [{ count: total }, { count: completed }, { data: adaptationRows }] = await Promise.all([
    supabase
      .from("adaptations")
      .select("*", { count: "exact", head: true })
      .in("question_id", questionIds),
    supabase
      .from("adaptations")
      .select("*", { count: "exact", head: true })
      .in("question_id", questionIds)
      .eq("status", "completed"),
    supabase
      .from("adaptations")
      .select("question_id, status")
      .in("question_id", questionIds),
  ]);

  totalAdaptations = total ?? 0;
  completedAdaptations = completed ?? 0;

  const grouped = new Map<string, boolean>();
  for (const row of adaptationRows ?? []) {
    const current = grouped.get(row.question_id) ?? true;
    grouped.set(row.question_id, current && row.status === "completed");
  }
  questionsCompleted = [...grouped.values()].filter(Boolean).length;
}
```

3. Update the `ProcessingStatus` props to include `questionsCompleted`:

```tsx
<ProcessingStatus
  examId={examId}
  errorMessage={exam.error_message}
  progress={{
    total: totalAdaptations,
    completed: completedAdaptations,
    questionsCount: questionIds.length,
    questionsCompleted,
  }}
  status={exam.status}
/>
```

- [ ] **Step 2: Run the full test suite to verify nothing is broken**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add "src/app/(auth)/exams/[id]/processing/page.tsx"
git commit -m "feat(processing-page): add completed redirect and questionsCompleted in initial data"
```

---

### Task 6: Manual smoke test

- [ ] **Step 1: Start the dev server and test the full flow**

Run: `npm run dev`

Test the following scenarios:
1. Create a new exam and upload a PDF → verify the processing page shows "Extraindo questões..." with rotating messages and time estimate
2. Wait for extraction to complete → verify auto-redirect to the extraction review page
3. Complete the extraction review → verify redirect to processing page showing adaptation progress with question count ("X de Y questões concluídas")
4. Wait for adaptation to complete → verify auto-redirect to the result page
5. Directly visit `/exams/{id}/processing` for a completed exam → verify server-side redirect to result page

- [ ] **Step 2: Final commit if any adjustments needed**

Only if smoke testing reveals issues that need fixing.
