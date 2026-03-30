# Processing & Extraction Progress Tracking

**Date:** 2026-03-30
**Status:** Draft

## Problem

The processing screen lacks real-time feedback. Teachers must manually refresh the browser to see progress updates. During extraction, there is no granular progress at all. During adaptation, progress is shown per-adaptation rather than per-question, which is less intuitive.

## Solution Overview

Add real-time polling with a client-side hook, restructure progress to be question-based, and improve visual feedback across all processing phases.

## Approach

Hook de polling + melhorias incrementais no `ProcessingStatus` existente. Aproveita o endpoint `GET /api/exams/[id]/status` que já existe.

---

## Design

### 1. Hook `useExamProgress`

**Location:** `src/features/exams/results/hooks/use-exam-progress.ts`

A client-side hook that polls the existing status endpoint.

- **Interval:** 4 seconds
- **Auto-stop:** Stops polling when status is `completed`, `error`, or `awaiting_answers`
- **Status redirects:** On `completed` → redirect to `/exams/{id}/result`. On `awaiting_answers` → redirect to `/exams/{id}/extraction`
- **Input:** `examId: string`, `initialData: ExamProgressData`
- **Returns:** `{ status, errorMessage, progress, isPolling }`
- Uses `initialData` from server render as first value — no loading flash

```typescript
type ExamProgressData = {
  status: ExamStatus;
  errorMessage: string | null;
  progress: {
    total: number;
    completed: number;
    questionsCount: number;
    questionsCompleted: number;
  };
};
```

### 2. Endpoint Update — `GET /api/exams/[id]/status`

Add `questionsCompleted` field to the response. A question is "completed" when **all** of its adaptations have status `completed`.

**Updated response:**
```json
{
  "status": "analyzing",
  "errorMessage": null,
  "progress": {
    "total": 10,
    "completed": 6,
    "questionsCount": 5,
    "questionsCompleted": 3
  }
}
```

**Implementation:** Fetch all adaptations as `{ question_id, status }` (not `head: true`), group in JS by `question_id`, count questions where every adaptation has status `completed`. The dataset is small (typically <100 rows), so in-JS grouping is fine.

**Early return (zero questions):** The existing zero-questions early return must also include `questionsCompleted: 0` in the progress object.

### 3. `ProcessingStatus` — Client Component Refactor

Convert from server component to `"use client"`. Receives `initialData` as props from the server-rendered `page.tsx`.

#### 3a. Phases without granular progress (uploading, extracting)

- Keep the existing animated pulse bar
- **Uploading:** Static message "Fazendo upload do arquivo PDF..." (this phase is near-instant, no rotating messages needed)
- **Extracting:** Add **rotating messages** that cycle every ~4s to give a sense of activity: "Lendo o PDF...", "Identificando questoes...", "Analisando alternativas...", "Interpretando enunciados..."
- Subtle time estimate text: "Isso geralmente leva entre 1 e 2 minutos"

#### 3b. Adaptation phase (analyzing with progress > 0)

- Title: "Adaptando questoes..."
- Real progress bar with percentage
- Primary counter: **"3 de 10 questoes concluidas"** (using `questionsCompleted / questionsCount`). Singular form "1 de N questao concluida" when `questionsCompleted === 1`.
- Contextual rotating messages: "Analisando habilidades BNCC...", "Identificando nivel Bloom...", "Gerando adaptacoes..."

#### 3c. Completion (completed)

- **Automatic redirect** to `/exams/{examId}/result` via `router.push()`
- ~1s delay so the bar visually reaches 100% before redirect

#### 3d. Error (error)

- No changes — keep current behavior (red box with error message and action buttons)

### 4. Page Architecture

`processing/page.tsx` remains a server component:
- Fetches initial data (exam status, progress)
- **Server-side redirects:** If status is already `completed`, redirect to `/exams/{id}/result`. If `awaiting_answers`, redirect to `/exams/{id}/extraction` (already exists). This prevents flash-of-wrong-content before the client hook mounts.
- Passes data as `initialData` prop to `ProcessingStatus`

`ProcessingStatus` becomes `"use client"`:
- Renders immediately with server data (no loading state)
- Mounts `useExamProgress` hook which starts polling
- Updates UI reactively as polling returns new data
- On `completed` → redirects to result page
- On `awaiting_answers` → redirects to extraction page
- On `error` → stops polling, shows error UI

### 5. Data Flow

```
Server render (page.tsx)
  -> initial query to Supabase (status + progress)
    -> pass as initialData to ProcessingStatus
      -> ProcessingStatus mounts with server data
        -> useExamProgress starts polling every 4s
          -> each poll updates status, progress, messages
            -> status === "completed" -> router.push(/result)
            -> status === "awaiting_answers" -> router.push(/extraction)
            -> status === "error" -> stop polling, show error
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/features/exams/results/hooks/use-exam-progress.ts` | Create | Polling hook |
| `src/app/api/exams/[id]/status/route.ts` | Modify | Add `questionsCompleted` to response |
| `src/features/exams/results/components/processing-status.tsx` | Modify | Convert to client component, integrate hook, rotating messages, auto-redirect |
| `src/app/(auth)/exams/[id]/processing/page.tsx` | Modify | Pass `initialData` shape to ProcessingStatus |

## Out of Scope

- SSE or WebSocket real-time updates
- Backend restructuring of extraction to be per-question
- Changes to the extraction review screen
- Changes to the result page
- Framer Motion or animation libraries
