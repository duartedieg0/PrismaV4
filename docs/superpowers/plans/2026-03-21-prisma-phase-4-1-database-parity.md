# Prisma Phase 4.1 Database Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** restaurar a integridade entre repositório e banco do PrismaV2, trazendo migrations e seed reproduzíveis a partir do baseline canônico do Prisma atual e ajustando apenas o necessário para fechar a Fase 4 com E2E confiável.

**Architecture:** o Prisma atual passa a ser o baseline canônico de schema, RLS, triggers, storage e seed em `PrismaV2/supabase/`. A Fase 4.1 não redesenha o modelo de dados; ela consolida a fonte de verdade do banco dentro do repositório e adiciona somente uma migration corretiva mínima caso o código já implementado até a Fase 4 exija compatibilidade adicional.

**Tech Stack:** Supabase SQL migrations, seed SQL, Next.js 16, React 19, TypeScript 5, Vitest, Playwright

---

### Task 1: Importar o baseline canônico de migrations e seed

**Files:**
- Create: `supabase/migrations/00001_initial_schema.sql`
- Create: `supabase/migrations/00002_rls_policies.sql`
- Create: `supabase/migrations/00003_triggers_and_indexes.sql`
- Create: `supabase/migrations/00004_storage.sql`
- Create: `supabase/migrations/00005_default_model.sql`
- Create: `supabase/migrations/00006_feedback_dismissed.sql`
- Create: `supabase/migrations/00007_adapted_alternatives.sql`
- Create: `supabase/seed.sql`
- Modify: `supabase/migrations/README.md`
- Test/Docs: `docs/superpowers/plans/2026-03-21-prisma-phase-4-1-database-parity.md`

- [ ] **Step 1: Write the failing parity inventory test**

Create a focused test that asserts the expected migration filenames and `seed.sql` exist in `PrismaV2/supabase/`.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test -- src/test/gateways/supabase-filesystem.test.ts`
Expected: FAIL because the baseline files do not exist yet.

- [ ] **Step 3: Import the baseline files from the canonical Prisma repository**

Copy the SQL content from `/Users/iduarte/Downloads/Prisma/supabase/migrations/` and `/Users/iduarte/Downloads/Prisma/supabase/seed.sql` into the corresponding `PrismaV2/supabase/` paths.

Do not redesign SQL in this task. Preserve ordering and semantics from the canonical source.

- [ ] **Step 4: Update the Supabase README baseline note**

Document that the V2 rebuild now vendors the current Prisma baseline locally and that future migrations must be additive from this point.

- [ ] **Step 5: Run the focused test to verify it passes**

Run: `npm run test -- src/test/gateways/supabase-filesystem.test.ts`
Expected: PASS.

### Task 2: Detect and codify the compatibility gap between baseline SQL and Phase 4 code assumptions

**Files:**
- Create: `src/test/gateways/supabase-schema-parity.test.ts`
- Modify: `src/gateways/supabase/schema-baseline.ts`
- Optionally create: `supabase/migrations/00008_phase_4_1_compatibility.sql`

- [ ] **Step 1: Write the failing compatibility test**

Cover the entities and columns already assumed by Phase 0-4 code:
- `profiles`
- `subjects`
- `grade_levels`
- `exams`
- key auth/dashboard fields used by server code and E2E helpers

The test should assert which objects are provided by baseline and which mismatches still exist against the code assumptions.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test -- src/test/gateways/supabase-schema-parity.test.ts`
Expected: FAIL because current expectations do not match the imported baseline exactly.

- [ ] **Step 3: Minimize the gap in code or migration form**

Apply this rule:
- prefer updating app/E2E assumptions to the canonical baseline when the Phase 4 behavior does not require schema extension;
- only add `00008_phase_4_1_compatibility.sql` if a Phase 0-4 requirement truly needs additive schema compatibility.

Do not fork the model unnecessarily. Keep changes minimal and explicit.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm run test -- src/test/gateways/supabase-schema-parity.test.ts`
Expected: PASS.

### Task 3: Align seed strategy and E2E fixtures with the repository-owned database baseline

**Files:**
- Modify: `e2e/helpers/auth-session.ts`
- Modify: `e2e/teacher-dashboard.spec.ts`
- Modify: `.env.example` if a stricter local contract is required
- Create or modify tests if needed under `src/test/` or `e2e/`

- [ ] **Step 1: Write the failing test or extend current E2E expectations**

Cover:
- authenticated dashboard access with a seeded teacher profile;
- E2E helpers only depending on repository-owned schema assumptions;
- no ad hoc inserts that assume columns absent from the baseline.

- [ ] **Step 2: Run the focused tests to verify they fail for the right reason**

Run:
- `npm run test -- src/test/features/auth/get-profile.test.ts src/test/integration/teacher-dashboard.integration.test.ts`
- `npm run test:e2e -- e2e/auth-access.spec.ts e2e/teacher-dashboard.spec.ts`

Expected: FAIL if helpers still assume non-baseline columns or non-reproducible data setup.

- [ ] **Step 3: Implement the minimal fixture alignment**

Adjust helpers to:
- rely on the canonical schema;
- create only data supported by the baseline or consume seeded data;
- keep authenticated E2E deterministic without masking schema drift.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:
- `npm run test -- src/test/features/auth/get-profile.test.ts src/test/integration/teacher-dashboard.integration.test.ts`
- `npm run test:e2e -- e2e/auth-access.spec.ts e2e/teacher-dashboard.spec.ts`

Expected: PASS.

### Task 4: Close Fase 4.1 with documentation and full quality gate

**Files:**
- Modify: `docs/superpowers/plans/2026-03-21-prisma-phase-4-teacher-dashboard.md`
- Optionally modify: `docs/superpowers/plans/2026-03-21-prisma-phase-4-1-database-parity.md`
- Optionally modify: `.env.example`

- [ ] **Step 1: Update the Phase 4 record**

Document that Fase 4 now depends on repository-owned migrations and seed and that the dashboard/auth E2E closure is validated against this baseline.

- [ ] **Step 2: Run the full quality gate**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:a11y`
- `npm run test:e2e`

Expected: all PASS.

- [ ] **Step 3: Record any intentional residual database differences**

If any schema difference remains between Prisma legacy and PrismaV2 after this phase, document it explicitly as intentional and phase-bounded. Otherwise, state parity baseline is restored.
