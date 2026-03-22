# Prisma Phase 4 Teacher Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** reconstruir o dashboard do professor como um repositório orientado a status, com metadados legíveis, ações contextuais e estados claros de empty/loading/error.

**Architecture:** separar o dashboard em três camadas: contrato/view model de prova, serviço de listagem do professor e UI orientada a estado. A página `/dashboard` deve consumir apenas o serviço canônico `listTeacherExams`, enquanto o mapeamento de status e ações deve reutilizar os helpers centralizados de `src/domains/exams/contracts.ts`, sem criar lógica ad hoc ou segunda fonte de verdade em componentes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Supabase SSR, Vitest, Playwright, design-system local

---

### Task 1: Definir o view model canônico de prova e mapeamento de status

**Files:**
- Create: `src/features/exams/dashboard/contracts.ts`
- Modify: `src/domains/exams/contracts.ts`
- Create: `src/test/features/exams/dashboard/contracts.test.ts`

- [ ] **Step 1: Write the failing view model tests**

Cover:
- shape mínima do item de dashboard;
- `supports` selecionados por prova;
- status suportados no repositório (`uploading`, `extracting`, `awaiting_answers`, `analyzing`, `completed`, `error`);
- label, tone e destination por status;
- fallback de tema/metadados ausentes.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test -- src/test/features/exams/dashboard/contracts.test.ts`
Expected: FAIL because the dashboard contracts do not exist yet.

- [ ] **Step 3: Implement the minimal contracts and status presentation**

Export:
- `TeacherExamListItem`;
- `TeacherExamStatus`;
- reuse the centralized helper for status label/tone in `src/domains/exams/contracts.ts`;
- reuse the centralized helper for next route/action per status in `src/domains/exams/contracts.ts`.

Keep the dashboard-specific contract focused on the repository view model, including selected supports.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm run test -- src/test/features/exams/dashboard/contracts.test.ts`
Expected: PASS.

### Task 2: Extrair o serviço canônico `listTeacherExams`

**Files:**
- Create: `src/features/exams/dashboard/list-teacher-exams.ts`
- Create: `src/test/features/exams/dashboard/list-teacher-exams.test.ts`
- Create: `src/test/integration/teacher-dashboard.integration.test.ts`

- [ ] **Step 1: Write the failing service tests**

Cover:
- ordenação por `created_at` desc;
- filtro por professor autenticado;
- joins de disciplina e série;
- inclusão de supports selecionados;
- preservação de `error_message`;
- normalização para o view model canônico.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:
- `npm run test -- src/test/features/exams/dashboard/list-teacher-exams.test.ts`
- `npm run test -- src/test/integration/teacher-dashboard.integration.test.ts`
Expected: FAIL because the service does not exist yet.

- [ ] **Step 3: Implement the minimal list service**

Use Supabase SSR gateway with explicit dependency injection in tests.
Return normalized `TeacherExamListItem[]`, never raw DB rows to the page layer.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:
- `npm run test -- src/test/features/exams/dashboard/list-teacher-exams.test.ts`
- `npm run test -- src/test/integration/teacher-dashboard.integration.test.ts`
Expected: PASS.

### Task 3: Reconstruir a UI do dashboard orientada a estado

**Files:**
- Modify: `src/app-shell/authenticated/teacher-shell.tsx`
- Create: `src/features/exams/dashboard/components/dashboard-header.tsx`
- Create: `src/features/exams/dashboard/components/exam-repository.tsx`
- Create: `src/features/exams/dashboard/components/exam-repository-item.tsx`
- Create: `src/features/exams/dashboard/components/exam-repository-empty.tsx`
- Modify: `src/app/(auth)/dashboard/page.tsx`
- Modify: `src/test/smoke/app-shell-smoke.test.tsx`
- Create: `src/test/features/exams/dashboard/exam-repository.test.tsx`
- Create: `src/test/features/exams/dashboard/exam-repository.a11y.test.tsx`

- [ ] **Step 1: Write the failing UI tests**

Cover:
- saudação/contexto do professor;
- listagem de provas com status sempre visível;
- ações contextuais por status;
- empty state com CTA de nova adaptação;
- erro de prova refletido na UI;
- heading hierarchy e links acionáveis.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:
- `npm run test -- src/test/features/exams/dashboard/exam-repository.test.tsx`
- `npm run test:a11y -- src/test/features/exams/dashboard/exam-repository.a11y.test.tsx`
Expected: FAIL because the repository UI does not exist yet.

- [ ] **Step 3: Implement the minimal dashboard UI**

Use `TeacherShell` and existing design-system primitives.
Refactor `TeacherShell` so loading and empty states are opt-in slots instead of unconditional content.
Do not fetch inside client components.
The page should:
- read the authenticated profile;
- call `listTeacherExams`;
- render repository empty/list/error states deterministically.
- leave a visual placeholder for future filters without implementing filtering logic yet.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:
- `npm run test -- src/test/features/exams/dashboard/exam-repository.test.tsx`
- `npm run test:a11y -- src/test/features/exams/dashboard/exam-repository.a11y.test.tsx`
Expected: PASS.

### Task 4: Cobrir navegação e fechar a Fase 4

**Files:**
- Modify: `e2e/smoke-shells.spec.ts`
- Create: `e2e/teacher-dashboard.spec.ts`
- Modify: `.env.example` if new E2E data contract is required

- [ ] **Step 1: Write or extend E2E coverage**

Cover:
- dashboard acessível para professor autenticado;
- empty state navegável;
- item em cada estado expõe a destination correta pela regra centralizada; só navegar em E2E para superfícies já existentes nesta fase;
- status visível na listagem.

- [ ] **Step 2: Implement the minimal E2E fixtures/helpers needed**

Prefer deterministic seeded data or conditional skip if teacher E2E credentials/data are absent, with env contract explicit in `.env.example`.
If later-phase surfaces (`processing`, `extraction`, `result`) are not implemented yet, validate href/destination instead of hard navigation in this phase.

- [ ] **Step 3: Run the full quality gate for Phase 4**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:a11y`
- `npm run test:e2e`

Expected: all PASS.

---

## Phase 4 Closure Note

The closure of Phase 4 depends on the repository-owned Supabase baseline being
present in `PrismaV2/supabase/`, including imported migrations and `seed.sql`.

Phase 4.1 is the database parity checkpoint that makes this closure durable:
- the dashboard/auth flow must validate against migrations committed in-repo;
- E2E must not depend on schema drift outside the repository;
- any remaining schema difference after Phase 4.1 must be explicit and intentional.
