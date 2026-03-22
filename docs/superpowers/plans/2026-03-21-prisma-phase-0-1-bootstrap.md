# Prisma Phase 0-1 Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** bootstrap the new PrismaV2 workspace with the architectural foundation from Phase 0 and the design-system/app-shell baseline from Phase 1 so later feature phases can be implemented without structural rework.

**Architecture:** build a fresh Next.js 16 + React 19 App Router application under `src/`, centralize shared contracts in `src/domains`, application concerns in `src/services` and `src/gateways`, and introduce a formal design-system and shell layer before feature pages. Preserve the current Supabase data model as the compatibility baseline while formalizing error taxonomy, observability contracts, and test infrastructure from day one.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui CLI, Vitest, Testing Library, jest-axe, Playwright, Supabase SSR, Zod, Sonner

---

### Task 1: Bootstrap the workspace and baseline tooling

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Create: `components.json`
- Create: `postcss.config.mjs`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `.github/workflows/ci.yml`
- Create: `src/features/.gitkeep`
- Create: `src/mastra/.gitkeep`
- Create: `src/test/integration/.gitkeep`
- Create: `src/app/layout.tsx`
- Create: `src/app/(public)/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/providers.tsx`

- [ ] **Step 1: Write the failing smoke tests for app boot**

Create `src/test/smoke/app-shell-smoke.test.tsx` asserting the root page renders the product name and global providers can mount.

- [ ] **Step 2: Run the smoke test to verify it fails**

Run: `npm run test -- src/test/smoke/app-shell-smoke.test.tsx`
Expected: FAIL because project files and test tooling do not exist yet.

- [ ] **Step 3: Create the baseline Next.js workspace**

Recreate the project scripts from the current Prisma and add missing scripts required by `AGENTS.md`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:a11y": "vitest run --project a11y",
    "test:e2e": "playwright test"
  }
}
```

Install and configure Next.js 16, React 19, Tailwind CSS 4, shadcn, Vitest, Playwright, Testing Library, jest-axe, Supabase SSR and Zod.

Also create the Phase 0 quality baseline artifacts:
- GitHub Actions workflow with the canonical check order;
- placeholder integration-test folder for service-level suites;
- empty `features` and `mastra` roots so the target architecture exists from day one.

- [ ] **Step 4: Implement the minimal app boot files**

Create `src/app/layout.tsx`, `src/app/(public)/page.tsx`, `src/app/globals.css` and `src/app/providers.tsx` with a minimal renderable shell and keep the root route owned only by the public route group.

- [ ] **Step 5: Run the smoke test to verify it passes**

Run: `npm run test -- src/test/smoke/app-shell-smoke.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run baseline quality checks**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Expected: all PASS.

### Task 2: Formalize the target architecture and shared contracts

**Files:**
- Create: `src/domains/auth/contracts.ts`
- Create: `src/domains/exams/contracts.ts`
- Create: `src/domains/adaptations/contracts.ts`
- Create: `src/domains/errors/contracts.ts`
- Create: `src/domains/observability/contracts.ts`
- Create: `src/domains/index.ts`
- Create: `src/services/runtime/correlation-id.ts`
- Create: `src/services/runtime/request-context.ts`
- Create: `src/test/domains/contracts.test.ts`

- [ ] **Step 1: Write failing tests for the shared contracts**

Add contract tests that assert the canonical string unions and default helpers for:
- `UserRole`
- `ExamStatus`
- `QuestionType`
- `AdaptationStatus`
- product error categories
- observable event categories

- [ ] **Step 2: Run the contract tests to verify they fail**

Run: `npm run test -- src/test/domains/contracts.test.ts`
Expected: FAIL because the domain modules do not exist yet.

- [ ] **Step 3: Implement the domain contract modules**

Create focused modules exporting the canonical arrays, TypeScript inferred types, display metadata where needed, and the public `src/domains/index.ts` barrel.

- [ ] **Step 4: Implement correlation-id and request-context helpers**

Create runtime helpers that can:
- generate a correlation id;
- accept an externally provided correlation id;
- carry entity ids (`requestId`, `examId`, `questionId`, `adaptationId`, `workflowId`);
- normalize log-safe metadata.

- [ ] **Step 5: Run the contract tests to verify they pass**

Run: `npm run test -- src/test/domains/contracts.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the focused quality checks**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run test`

Expected: PASS.

### Task 3: Preserve the current Supabase compatibility baseline

**Files:**
- Create: `src/gateways/supabase/schema-baseline.ts`
- Create: `src/gateways/supabase/entity-map.ts`
- Create: `src/gateways/supabase/client.ts`
- Create: `src/gateways/supabase/server.ts`
- Create: `src/gateways/supabase/middleware.ts`
- Create: `src/test/gateways/schema-baseline.test.ts`
- Create: `supabase/migrations/README.md`
- Create: `supabase/config.toml`

- [ ] **Step 1: Write failing tests for entity compatibility metadata**

Create tests asserting the baseline entity map includes:
- preserved tables: `profiles`, `ai_models`, `agents`, `supports`, `subjects`, `grade_levels`, `exams`, `exam_supports`, `questions`, `adaptations`, `feedbacks`, `agent_evolutions`;
- extension-ready tables: `exams`, `questions`, `adaptations`, `agent_evolutions`.

- [ ] **Step 2: Run the entity tests to verify they fail**

Run: `npm run test -- src/test/gateways/schema-baseline.test.ts`
Expected: FAIL because no schema baseline module exists yet.

- [ ] **Step 3: Implement the compatibility baseline modules**

Translate the current Prisma migrations into typed metadata consumed by the new app. Do not invent schema drift; document what is preserved and where future extensions belong.

- [ ] **Step 4: Add Supabase gateway scaffolding**

Create SSR-safe client/server/middleware factories under `src/gateways/supabase/` using the new app structure and async cookie patterns required by Next.js 16.

- [ ] **Step 5: Run the entity tests to verify they pass**

Run: `npm run test -- src/test/gateways/schema-baseline.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the focused quality checks**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run test`

Expected: PASS.

### Task 4: Establish the product error taxonomy and observability baseline

**Files:**
- Create: `src/services/errors/product-error.ts`
- Create: `src/services/errors/public-error.ts`
- Create: `src/services/observability/logger.ts`
- Create: `src/services/observability/events.ts`
- Create: `src/test/services/product-error.test.ts`
- Create: `src/test/services/logger.test.ts`

- [ ] **Step 1: Write the failing tests for product errors and structured logs**

Add tests that verify:
- every error has `category`, `code`, `message`, `safeMessage`, `source`, `stage`;
- logger output includes correlation id and observable entity ids;
- event helpers cover upload/extraction/adaptation/feedback/evolution lifecycle events.

- [ ] **Step 2: Run the tests to verify they fail**

Run:
- `npm run test -- src/test/services/product-error.test.ts`
- `npm run test -- src/test/services/logger.test.ts`

Expected: FAIL because service modules do not exist yet.

- [ ] **Step 3: Implement the minimal error and observability services**

Create typed product errors, user-safe message helpers, JSON structured logging and event builders aligned with `spec-01` and `spec-12`.

- [ ] **Step 4: Run the tests to verify they pass**

Run:
- `npm run test -- src/test/services/product-error.test.ts`
- `npm run test -- src/test/services/logger.test.ts`

Expected: PASS.

- [ ] **Step 5: Run the focused quality checks**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run test`

Expected: PASS.

### Task 5: Define design tokens and global UI primitives baseline

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/design-system/tokens/semantic-tokens.ts`
- Create: `src/design-system/tokens/layout.ts`
- Create: `src/design-system/typography/fonts.ts`
- Create: `src/design-system/components/brand-mark.tsx`
- Create: `src/design-system/components/surface.tsx`
- Create: `src/design-system/components/section-shell.tsx`
- Create: `src/test/design-system/tokens.test.ts`
- Create: `src/test/design-system/brand-mark.test.tsx`

- [ ] **Step 1: Write failing tests for token exports and brand primitives**

Add tests for token modules and a render test for the brand mark component.

- [ ] **Step 2: Run the tests to verify they fail**

Run:
- `npm run test -- src/test/design-system/tokens.test.ts`
- `npm run test -- src/test/design-system/brand-mark.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Implement the visual baseline**

Replace the neutral prototype tokens with an editorial professional palette, typography variables, semantic states, spacing, radius, shadows and motion tokens. Build only the primitives needed for the shells.

- [ ] **Step 4: Run the tests to verify they pass**

Run:
- `npm run test -- src/test/design-system/tokens.test.ts`
- `npm run test -- src/test/design-system/brand-mark.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run a11y coverage for primitives**

Run: `npm run test:a11y`
Expected: PASS for the current primitive coverage set.

### Task 6: Implement public, teacher and admin shell scaffolding

**Files:**
- Create: `src/app/(public)/layout.tsx`
- Create: `src/app/(public)/page.tsx`
- Create: `src/app/(public)/blocked/page.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/app/(auth)/dashboard/page.tsx`
- Create: `src/app/(admin)/config/page.tsx`
- Create: `src/app-shell/public/public-shell.tsx`
- Create: `src/app-shell/authenticated/teacher-shell.tsx`
- Create: `src/app-shell/admin/admin-shell.tsx`
- Create: `src/design-system/components/page-header.tsx`
- Create: `src/design-system/components/section-header.tsx`
- Create: `src/design-system/components/empty-state.tsx`
- Create: `src/design-system/components/loading-state.tsx`
- Create: `src/design-system/components/error-state.tsx`
- Create: `src/design-system/components/form-section.tsx`
- Create: `src/design-system/components/status-badge.tsx`
- Create: `src/design-system/components/data-table-wrapper.tsx`
- Create: `src/design-system/components/breadcrumbs.tsx`
- Create: `src/design-system/components/inline-error.tsx`
- Create: `src/design-system/components/processing-banner.tsx`
- Create: `src/design-system/components/toast-region.tsx`
- Create: `src/test/app-shell/shells.test.tsx`
- Create: `src/test/app-shell/shells.a11y.test.tsx`
- Create: `e2e/smoke-shells.spec.ts`

- [ ] **Step 1: Write failing tests for the three shells**

Add render tests asserting each shell exposes:
- navigation landmarks;
- page heading region;
- breadcrumb support;
- loading and empty-state slots;
- global feedback patterns for toast, inline error and processing banners.

- [ ] **Step 2: Run the shell tests to verify they fail**

Run: `npm run test -- src/test/app-shell/shells.test.tsx`
Expected: FAIL because shell components do not exist yet.

- [ ] **Step 3: Implement the composed shell layer**

Create public, teacher and admin shells plus the baseline composed components for headers, states, breadcrumbs, feedback patterns, badges and table/form wrappers.

- [ ] **Step 4: Verify the shell tests pass**

Run: `npm run test -- src/test/app-shell/shells.test.tsx`
Expected: PASS.

- [ ] **Step 5: Add accessibility coverage for shell behaviors**

Create `src/test/app-shell/shells.a11y.test.tsx` and run:
- `npm run test:a11y`

Expected: PASS for the shell compositions and global feedback patterns.

- [ ] **Step 6: Add end-to-end shell smoke coverage**

Create Playwright tests covering:
- public landing smoke;
- teacher dashboard shell smoke;
- admin config shell smoke.

- [ ] **Step 7: Run the full quality gate for the block**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:a11y`
- `npm run test:e2e`

Expected: all PASS.
