# Prisma Phase 6 Extraction and Answer Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** reconstruir a fase de extração e revisão humana com contratos formais, persistência consistente de questões, warnings governados e handoff seguro para a adaptação.

**Architecture:** separar a Fase 6 em cinco blocos: contratos/normalização de extração, serviço compatível com o runtime legado, página server-side de revisão, handlers `status` e `answers`, e validação da jornada ponta a ponta. O runtime de extração deve ficar encapsulado atrás de um gateway compatível com a Edge Function atual, sem antecipar a migração para Mastra da Fase 7.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Supabase SSR, Zod, Vitest, Playwright, design-system local

---

### Task 1: Definir contratos de extração, normalização e submissão de respostas

**Files:**
- Create: `src/features/exams/extraction/contracts.ts`
- Create: `src/features/exams/extraction/normalization.ts`
- Create: `src/test/features/exams/extraction/contracts.test.ts`
- Create: `src/test/features/exams/extraction/normalization.test.ts`

- [ ] **Step 1: Write the failing contract and normalization tests**

Cover:
- `ExtractionRequest`
- `ExtractionResult`
- `ExtractedQuestion`
- `VisualElement`
- `AnswerReviewSubmission`
- normalização de objetivas e dissertativas
- warnings parciais explícitos
- rejeição quando não há questões válidas
- preservação de elementos visuais

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:
- `npm run test -- src/test/features/exams/extraction/contracts.test.ts`
- `npm run test -- src/test/features/exams/extraction/normalization.test.ts`

Expected: FAIL because the extraction modules do not exist yet.

- [ ] **Step 3: Implement the minimal extraction contracts and normalization**

Use typed helpers to normalize raw extraction payloads into a stable review model.
Warnings must survive normalization as first-class data; “no questions found” must
be represented as a fatal extraction outcome.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:
- `npm run test -- src/test/features/exams/extraction/contracts.test.ts`
- `npm run test -- src/test/features/exams/extraction/normalization.test.ts`

Expected: PASS.

### Task 2: Extrair o serviço compatível de processamento da extração

**Files:**
- Create: `src/features/exams/extraction/process-extraction.ts`
- Create: `src/gateways/extraction/legacy-extraction.ts`
- Create: `src/test/features/exams/extraction/process-extraction.test.ts`
- Create: `src/test/integration/process-extraction.integration.test.ts`

- [ ] **Step 1: Write the failing service and gateway tests**

Cover:
- leitura do exame em `extracting`
- chamada do gateway legado de extração
- normalização das questões
- persistência consistente em `questions`
- transição para `awaiting_answers`
- transição para `error` quando nenhuma questão é encontrada
- warnings parciais sem descarte cego
- prevenção de duplicidade de persistência

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:
- `npm run test -- src/test/features/exams/extraction/process-extraction.test.ts`
- `npm run test -- src/test/integration/process-extraction.integration.test.ts`

Expected: FAIL because the service/gateway do not exist yet.

- [ ] **Step 3: Implement the minimal extraction processing service**

Inject database/runtime dependencies explicitly. The service must be the single
place that decides status updates, question persistence and fatal vs partial
failure outcomes. Keep the legacy runtime wrapped in `legacy-extraction.ts`.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:
- `npm run test -- src/test/features/exams/extraction/process-extraction.test.ts`
- `npm run test -- src/test/integration/process-extraction.integration.test.ts`

Expected: PASS.

### Task 3: Construir a página e UI de revisão humana

**Files:**
- Create: `src/app/(auth)/exams/[id]/extraction/page.tsx`
- Create: `src/features/exams/extraction/components/extraction-review.tsx`
- Create: `src/features/exams/extraction/components/question-review-card.tsx`
- Create: `src/features/exams/extraction/components/extraction-warning-list.tsx`
- Create: `src/test/features/exams/extraction/extraction-review.test.tsx`
- Create: `src/test/features/exams/extraction/extraction-review.a11y.test.tsx`

- [ ] **Step 1: Write the failing UI tests**

Cover:
- renderização de questões objetivas e dissertativas
- warnings visíveis por questão
- elementos visuais preservados na revisão
- captura de alternativa correta
- captura de resposta esperada para dissertativas
- empty state explícito quando não há questões
- estado pendente do CTA
- acessibilidade básica da revisão

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:
- `npm run test -- src/test/features/exams/extraction/extraction-review.test.tsx`
- `npm run test:a11y -- src/test/features/exams/extraction/extraction-review.a11y.test.tsx`

Expected: FAIL because the review UI does not exist yet.

- [ ] **Step 3: Implement the minimal review UI**

Use the existing teacher shell and design-system primitives. Data loading must
stay server-side in the page. If the exam is not in `awaiting_answers`, redirect
back to the processing route deterministically.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:
- `npm run test -- src/test/features/exams/extraction/extraction-review.test.tsx`
- `npm run test:a11y -- src/test/features/exams/extraction/extraction-review.a11y.test.tsx`

Expected: PASS.

### Task 4: Fechar os handlers `GET /api/exams/[id]/status` e `POST /api/exams/[id]/answers`

**Files:**
- Create: `src/app/api/exams/[id]/status/route.ts`
- Create: `src/app/api/exams/[id]/answers/route.ts`
- Create: `src/test/features/exams/extraction/exam-status-route.test.ts`
- Create: `src/test/features/exams/extraction/submit-answers-route.test.ts`

- [ ] **Step 1: Write the failing route coverage**

Cover:
- 401 quando usuário não autenticado
- 403 quando exame não pertence ao professor
- 404 quando exame não existe
- payload de status estável com `status`, `errorMessage` e progresso
- 400 em submissão de respostas inválida
- atualização de `correct_answer`
- transição para `analyzing`
- trigger compatível para a etapa seguinte

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:
- `npm run test -- src/test/features/exams/extraction/exam-status-route.test.ts`
- `npm run test -- src/test/features/exams/extraction/submit-answers-route.test.ts`

Expected: FAIL because the route handlers do not exist yet.

- [ ] **Step 3: Implement the minimal route handlers**

The routes should delegate to shared validation/service logic, return stable JSON
errors and avoid embedding raw Supabase/runtime details in responses.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:
- `npm run test -- src/test/features/exams/extraction/exam-status-route.test.ts`
- `npm run test -- src/test/features/exams/extraction/submit-answers-route.test.ts`

Expected: PASS.

### Task 5: Validar a jornada ponta a ponta da Fase 6

**Files:**
- Create: `e2e/extraction-review.spec.ts`
- Modify: `e2e/helpers/auth-session.ts` only if required by the reviewed phase scope

- [ ] **Step 1: Write the failing E2E coverage**

Cover:
- redirecionamento de exame fora de `awaiting_answers`
- revisão com warning parcial
- submissão de respostas objetivas e dissertativas
- redirecionamento para `/processing` após salvar

- [ ] **Step 2: Run the focused E2E to verify it fails**

Run:
- `npm run test:e2e -- e2e/extraction-review.spec.ts`

Expected: FAIL before the review flow is connected.

- [ ] **Step 3: Implement the minimal E2E support**

Prefer browser-level API stubbing for the new route interactions. Do not create
new infra workarounds outside the already documented Supabase auth debt.

- [ ] **Step 4: Run the full quality gate**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:a11y`
- `npm run test:e2e`

Expected: all PASS, with any remaining Supabase infra risk documented explicitly.
