# Prisma Phase 5 New Exam and Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** reconstruir a jornada de nova adaptação com contratos formais, validação forte, service de criação canônico e UX superior para upload de PDF.

**Architecture:** separar a Fase 5 em quatro blocos: contratos/validação, service `createExam`, página server-side de intake e rota `POST /api/exams`. A UI deve produzir input limpo e a mutação server-side deve centralizar persistência, upload, compensação e disparo do pipeline sem lógica monolítica no route handler.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Supabase SSR, Zod, Vitest, Playwright, design-system local

---

### Task 1: Definir contratos e validação do intake

**Files:**
- Create: `src/features/exams/create/contracts.ts`
- Create: `src/features/exams/create/validation.ts`
- Create: `src/test/features/exams/create/contracts.test.ts`
- Create: `src/test/features/exams/create/validation.test.ts`

- [ ] **Step 1: Write the failing contract and validation tests**

Cover:
- `CreateExamInput`
- `CreateExamResult`
- `UploadedPdf`
- `ExamSupportSelection`
- validação de PDF
- disciplina/ano/série obrigatórios
- ao menos um apoio
- tema opcional com limite

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:
- `npm run test -- src/test/features/exams/create/contracts.test.ts`
- `npm run test -- src/test/features/exams/create/validation.test.ts`

Expected: FAIL because the create-exam modules do not exist yet.

- [ ] **Step 3: Implement the minimal contracts and validation**

Use Zod for input validation and export reusable PDF validation helpers for both
client and server paths.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:
- `npm run test -- src/test/features/exams/create/contracts.test.ts`
- `npm run test -- src/test/features/exams/create/validation.test.ts`

Expected: PASS.

### Task 2: Extrair o service canônico `createExam`

**Files:**
- Create: `src/features/exams/create/create-exam.ts`
- Create: `src/test/features/exams/create/create-exam.test.ts`
- Create: `src/test/integration/create-exam.integration.test.ts`

- [ ] **Step 1: Write the failing service tests**

Cover:
- criação do exame em `uploading`
- upload para storage
- persistência de `exam_supports`
- transição para `extracting`
- trigger inicial
- compensação em falha de upload
- erro controlado em falha de persistência

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:
- `npm run test -- src/test/features/exams/create/create-exam.test.ts`
- `npm run test -- src/test/integration/create-exam.integration.test.ts`

Expected: FAIL because the service does not exist yet.

- [ ] **Step 3: Implement the minimal `createExam` service**

Inject Supabase/storage/functions dependencies explicitly. The page and route
layers must never manipulate raw storage/database flow directly.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:
- `npm run test -- src/test/features/exams/create/create-exam.test.ts`
- `npm run test -- src/test/integration/create-exam.integration.test.ts`

Expected: PASS.

### Task 3: Construir a página e formulário de nova adaptação

**Files:**
- Create: `src/app/(auth)/exams/new/page.tsx`
- Create: `src/features/exams/create/components/new-exam-form.tsx`
- Create: `src/features/exams/create/components/pdf-dropzone.tsx`
- Create: `src/features/exams/create/components/support-selector.tsx`
- Create: `src/test/features/exams/create/new-exam-form.test.tsx`
- Create: `src/test/features/exams/create/new-exam-form.a11y.test.tsx`

- [ ] **Step 1: Write the failing UI tests**

Cover:
- renderização de disciplina, ano/série, tema, apoios e PDF
- erros de validação
- CTA de envio
- estado pendente
- empty state quando não há apoios ativos
- acessibilidade básica do formulário

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:
- `npm run test -- src/test/features/exams/create/new-exam-form.test.tsx`
- `npm run test:a11y -- src/test/features/exams/create/new-exam-form.a11y.test.tsx`

Expected: FAIL because the form UI does not exist yet.

- [ ] **Step 3: Implement the minimal intake UI**

Use the existing teacher shell and design-system primitives. Keep data fetching
server-side in the page. Do not fetch active options from client components.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:
- `npm run test -- src/test/features/exams/create/new-exam-form.test.tsx`
- `npm run test:a11y -- src/test/features/exams/create/new-exam-form.a11y.test.tsx`

Expected: PASS.

### Task 4: Fechar a rota `POST /api/exams` e validar a jornada

**Files:**
- Create: `src/app/api/exams/route.ts`
- Modify: `.env.example` if needed
- Create: `e2e/new-exam.spec.ts`

- [ ] **Step 1: Write the failing route and E2E coverage**

Cover:
- 401 quando usuário não autenticado
- 400 em input inválido
- 201 em criação bem-sucedida
- jornada E2E mínima do formulário com erro e sucesso

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:
- `npm run test -- src/test/features/exams/create/create-exam.test.ts src/test/integration/create-exam.integration.test.ts`
- `npm run test:e2e -- e2e/new-exam.spec.ts`

Expected: FAIL before the route is connected.

- [ ] **Step 3: Implement the minimal route handler**

The route should parse `FormData`, validate input, delegate to `createExam`, and
return stable JSON errors without embedding infrastructure details.

- [ ] **Step 4: Run the full quality gate**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:a11y`
- `npm run test:e2e`

Expected: all PASS, with any remaining Supabase infra risk documented explicitly.
