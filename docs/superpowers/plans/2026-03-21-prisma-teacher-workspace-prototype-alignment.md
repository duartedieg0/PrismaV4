# Prisma Teacher Workspace Prototype Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alinhar o eixo autenticado do professor ao protótipo de dashboard com alta fidelidade, mantendo backend e fluxos intactos.

**Architecture:** O `TeacherShell` será convertido em um workspace lateral consistente, e o dashboard servirá como referência visual para todas as demais telas do professor. A refatoração fica restrita ao frontend autenticado do professor e aos componentes visuais compartilhados desse eixo.

**Tech Stack:** Next.js 16, React 19, TypeScript, inline CSS variables, Vitest, Playwright

---

### Task 1: Recalibrar o `TeacherShell`

**Files:**
- Modify: `src/app-shell/authenticated/teacher-shell.tsx`
- Test: `src/test/app-shell/shells.test.tsx`
- Test: `src/test/app-shell/shells.a11y.test.tsx`

- [ ] Transformar o shell em um workspace com sidebar fixa e conteúdo principal claro
- [ ] Preservar navegação e semântica
- [ ] Garantir que as páginas do professor herdem a nova moldura sem mudar comportamento

### Task 2: Aproximar fortemente o dashboard do protótipo

**Files:**
- Modify: `src/app/(auth)/dashboard/page.tsx`
- Modify: `src/features/exams/dashboard/components/dashboard-header.tsx`
- Modify: `src/features/exams/dashboard/components/exam-repository.tsx`
- Modify: `src/features/exams/dashboard/components/exam-repository-item.tsx`
- Modify: `src/features/exams/dashboard/components/exam-repository-empty.tsx`
- Test: `src/test/features/exams/dashboard/exam-repository.test.tsx`
- Test: `src/test/features/exams/dashboard/exam-repository.a11y.test.tsx`
- Test: `e2e/teacher-dashboard.spec.ts`

- [ ] Reestruturar header, CTA e métricas
- [ ] Refazer cards de prova com linguagem do protótipo
- [ ] Preservar estados de empty e erro

### Task 3: Propagar a experiência para as demais telas do professor

**Files:**
- Modify: `src/app/(auth)/exams/new/page.tsx`
- Modify: `src/app/(auth)/exams/[id]/extraction/page.tsx`
- Modify: `src/app/(auth)/exams/[id]/processing/page.tsx`
- Modify: `src/app/(auth)/exams/[id]/result/page.tsx`
- Modify: `src/features/exams/create/components/new-exam-form.tsx`
- Modify: `src/features/exams/extraction/components/extraction-review.tsx`
- Modify: `src/features/exams/results/components/result-page.tsx`

- [ ] Reencaixar as telas no mesmo workspace visual
- [ ] Harmonizar CTA, blocos introdutórios e superfícies principais
- [ ] Manter o fluxo funcional inalterado

### Task 4: Validar a regressão visual e funcional

**Files:**
- Test: `npm run lint`
- Test: `npm run typecheck`
- Test: `npm run build`
- Test: `npm run test`
- Test: `npm run test:a11y`
- Test: `npm run test:e2e`

- [ ] Rodar o gate completo
- [ ] Confirmar que a mudança ficou restrita ao frontend do professor
