# Prisma Phase 8 Results, Copy and Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** entregar a superfície final de resultado do professor com cópia útil, feedback persistido e eventos observáveis de uso.

**Architecture:** a fase adiciona um módulo `features/exams/results` para consolidar leitura, cópia e feedback sobre adaptações já persistidas pela Fase 7. A UI continua em rotas Next.js, enquanto leitura consolidada, eventos e persistência ficam em serviços e handlers testáveis.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase, Vitest, Playwright, Tailwind CSS

---

## File Map

- Create: `src/features/exams/results/contracts.ts`
- Create: `src/features/exams/results/get-exam-result.ts`
- Create: `src/features/exams/results/copyable-block.ts`
- Create: `src/features/exams/results/record-result-event.ts`
- Create: `src/features/exams/results/components/processing-status.tsx`
- Create: `src/features/exams/results/components/result-page.tsx`
- Create: `src/features/exams/results/components/question-result.tsx`
- Create: `src/features/exams/results/components/adaptation-result-card.tsx`
- Create: `src/features/exams/results/components/feedback-form.tsx`
- Create: `src/features/exams/results/components/copy-action-bar.tsx`
- Create: `src/app/(auth)/exams/[id]/processing/page.tsx`
- Create or Modify: `src/app/(auth)/exams/[id]/result/page.tsx`
- Create: `src/app/api/exams/[id]/feedback/route.ts`
- Create: `src/test/features/exams/results/contracts.test.ts`
- Create: `src/test/features/exams/results/get-exam-result.test.ts`
- Create: `src/test/features/exams/results/copyable-block.test.ts`
- Create: `src/test/features/exams/results/record-result-event.test.ts`
- Create: `src/test/features/exams/results/processing-page.test.tsx`
- Create: `src/test/features/exams/results/result-page.test.tsx`
- Create: `src/test/features/exams/results/result-page.a11y.test.tsx`
- Create: `src/test/features/exams/results/feedback-route.test.ts`
- Create: `src/test/integration/exam-result.integration.test.ts`
- Create: `e2e/exam-result.spec.ts`

### Task 1: Contracts and result view model

**Files:**
- Create: `src/features/exams/results/contracts.ts`
- Create: `src/test/features/exams/results/contracts.test.ts`

- [ ] Write failing tests for `ExamResultView`, `QuestionResultView`, `AdaptationResultView`, `FeedbackSubmission` and `CopyEvent`.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/exams/results/contracts.test.ts`
- [ ] Implement the minimal contracts and helper constructors.
- [ ] Run the same test command and confirm PASS.

### Task 2: Copyable formatting utilities

**Files:**
- Create: `src/features/exams/results/copyable-block.ts`
- Create: `src/test/features/exams/results/copyable-block.test.ts`

- [ ] Write failing tests for essay copy, objective copy, alternatives ordering and full-support compilation.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/exams/results/copyable-block.test.ts`
- [ ] Implement the minimal pure formatter.
- [ ] Run the same test command and confirm PASS.

### Task 3: Consolidated result service

**Files:**
- Create: `src/features/exams/results/get-exam-result.ts`
- Create: `src/test/features/exams/results/get-exam-result.test.ts`
- Create: `src/test/integration/exam-result.integration.test.ts`

- [ ] Write failing unit tests for completed exam mapping, per-question support grouping, BNCC/Bloom exposure and partial adaptation errors.
- [ ] Write a failing integration test for reading the result shape from Supabase-like rows.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/exams/results/get-exam-result.test.ts src/test/integration/exam-result.integration.test.ts`
- [ ] Implement `getExamResult` with ownership/status assumptions compatible with existing routes.
- [ ] Run the same test command and confirm PASS.

### Task 4: Result events and feedback persistence contract

**Files:**
- Create: `src/features/exams/results/record-result-event.ts`
- Create: `src/test/features/exams/results/record-result-event.test.ts`
- Create: `src/app/api/exams/[id]/feedback/route.ts`
- Create: `src/test/features/exams/results/feedback-route.test.ts`

- [ ] Write failing tests for `result_viewed`, `adaptation_copied`, `exam_copy_compiled` and `feedback_submitted`.
- [ ] Write failing route tests for invalid payload, anonymous access, forbidden exam access, insert and update feedback flows.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/exams/results/record-result-event.test.ts src/test/features/exams/results/feedback-route.test.ts`
- [ ] Implement the event recorder as a non-blocking service seam.
- [ ] Implement the feedback route with idempotent upsert semantics over `feedbacks`.
- [ ] Run the same test command and confirm PASS.

### Task 5: Processing and result UI

**Files:**
- Create: `src/features/exams/results/components/processing-status.tsx`
- Create: `src/features/exams/results/components/result-page.tsx`
- Create: `src/features/exams/results/components/question-result.tsx`
- Create: `src/features/exams/results/components/adaptation-result-card.tsx`
- Create: `src/features/exams/results/components/feedback-form.tsx`
- Create: `src/features/exams/results/components/copy-action-bar.tsx`
- Create: `src/test/features/exams/results/processing-page.test.tsx`
- Create: `src/test/features/exams/results/result-page.test.tsx`
- Create: `src/test/features/exams/results/result-page.a11y.test.tsx`

- [ ] Write failing UI tests for processing states, completed result hierarchy, support switching, copy action affordance and inline feedback states.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/exams/results/processing-page.test.tsx src/test/features/exams/results/result-page.test.tsx`
- [ ] Implement the components with existing shell/design-system primitives.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:a11y -- src/test/features/exams/results/result-page.a11y.test.tsx`
- [ ] Fix any accessibility issues until PASS.

### Task 6: Page integration

**Files:**
- Create: `src/app/(auth)/exams/[id]/processing/page.tsx`
- Create or Modify: `src/app/(auth)/exams/[id]/result/page.tsx`

- [ ] Write failing page-level tests covering ownership, non-completed processing flow and completed result rendering.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/exams/results/processing-page.test.tsx src/test/features/exams/results/result-page.test.tsx`
- [ ] Implement the route pages and connect them to `getExamResult`.
- [ ] Ensure result view records `result_viewed` without blocking render.
- [ ] Run the same test command and confirm PASS.

### Task 7: End-to-end result journey

**Files:**
- Create: `e2e/exam-result.spec.ts`

- [ ] Write the E2E scenario for opening a completed exam result, copying adaptation content and sending feedback.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:e2e -- e2e/exam-result.spec.ts`
- [ ] Adjust fixtures/guards to respect the already accepted authenticated-infra skips where necessary.
- [ ] Re-run the same command and confirm PASS or intentional SKIP behavior.

### Task 8: Final validation

**Files:**
- Modify: any touched files above

- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run lint`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run typecheck`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:a11y`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:e2e`
- [ ] Document any accepted Phase 8 debt in `docs/technical-debt/` if discovered during execution.
