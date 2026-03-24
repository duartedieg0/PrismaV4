# Prisma Phase 9 Admin Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** entregar o console administrativo completo para modelos, agentes, supports, currículo e evolução de prompts, conectado ao runtime Mastra e ao fluxo do professor.

**Architecture:** a fase cria módulos administrativos por domínio em `src/features/admin`, com rotas e páginas Next.js apoiadas por contratos e validações compartilhadas. A evolução de agentes entra como submódulo de `agents`, usando o runtime Mastra da Fase 7 e persistindo histórico mínimo em `agent_evolutions`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase, Mastra, Vitest, Playwright, Tailwind CSS

---

## File Map

- Create: `supabase/migrations/00009_admin_configuration_governance.sql`
- Create: `src/features/admin/shared/contracts.ts`
- Create: `src/features/admin/shared/admin-guard.ts`
- Create: `src/features/admin/shared/mask-secret.ts`
- Create: `src/features/admin/shared/catalog-page.tsx`
- Create: `src/features/admin/shared/entity-manager.tsx`
- Create: `src/features/admin/models/contracts.ts`
- Create: `src/features/admin/models/validation.ts`
- Create: `src/features/admin/models/service.ts`
- Create: `src/features/admin/agents/contracts.ts`
- Create: `src/features/admin/agents/validation.ts`
- Create: `src/features/admin/agents/service.ts`
- Create: `src/features/admin/agents/components/agent-form.tsx`
- Create: `src/features/admin/agents/evolution/contracts.ts`
- Create: `src/features/admin/agents/evolution/validation.ts`
- Create: `src/features/admin/agents/evolution/service.ts`
- Create: `src/features/admin/agents/evolution/components/feedback-selector.tsx`
- Create: `src/features/admin/agents/evolution/components/prompt-comparator.tsx`
- Create: `src/features/admin/supports/contracts.ts`
- Create: `src/features/admin/supports/validation.ts`
- Create: `src/features/admin/supports/service.ts`
- Create: `src/features/admin/curriculum/contracts.ts`
- Create: `src/features/admin/curriculum/validation.ts`
- Create: `src/features/admin/curriculum/service.ts`
- Create or Modify: `src/app/(admin)/layout.tsx`
- Modify: `src/app/(admin)/config/page.tsx`
- Create: `src/app/(admin)/config/models/page.tsx`
- Create: `src/app/(admin)/config/agents/page.tsx`
- Create: `src/app/(admin)/config/agents/new/page.tsx`
- Create: `src/app/(admin)/config/agents/[id]/edit/page.tsx`
- Create: `src/app/(admin)/config/agents/[id]/evolve/page.tsx`
- Create: `src/app/(admin)/config/supports/page.tsx`
- Create: `src/app/(admin)/config/subjects/page.tsx`
- Create: `src/app/(admin)/config/grade-levels/page.tsx`
- Create: `src/app/api/admin/models/route.ts`
- Create: `src/app/api/admin/models/[id]/route.ts`
- Create: `src/app/api/admin/agents/route.ts`
- Create: `src/app/api/admin/agents/[id]/route.ts`
- Create: `src/app/api/admin/agents/[id]/feedbacks/route.ts`
- Create: `src/app/api/admin/agents/[id]/evolve/route.ts`
- Create: `src/app/api/admin/supports/route.ts`
- Create: `src/app/api/admin/supports/[id]/route.ts`
- Create: `src/app/api/admin/subjects/route.ts`
- Create: `src/app/api/admin/subjects/[id]/route.ts`
- Create: `src/app/api/admin/grade-levels/route.ts`
- Create: `src/app/api/admin/grade-levels/[id]/route.ts`
- Create: `src/test/features/admin/...`
- Create: `src/test/integration/admin-....test.ts`
- Create: `e2e/admin-config.spec.ts`

### Task 1: Schema and contracts

**Files:**
- Create: `supabase/migrations/00009_admin_configuration_governance.sql`
- Create: `src/features/admin/shared/contracts.ts`
- Create: `src/features/admin/models/contracts.ts`
- Create: `src/features/admin/agents/contracts.ts`
- Create: `src/features/admin/supports/contracts.ts`
- Create: `src/features/admin/curriculum/contracts.ts`
- Create: `src/test/features/admin/contracts.test.ts`

- [ ] Write failing tests for administrative entity contracts and any new schema assumptions such as agent version and model role/default metadata.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/admin/contracts.test.ts`
- [ ] Implement the migration and contracts with the minimum schema extension required by the phase.
- [ ] Run the same test command and confirm PASS.

### Task 2: Shared admin guard and utilities

**Files:**
- Create: `src/features/admin/shared/admin-guard.ts`
- Create: `src/features/admin/shared/mask-secret.ts`
- Create: `src/test/features/admin/admin-guard.test.ts`
- Create: `src/test/features/admin/mask-secret.test.ts`

- [ ] Write failing tests for admin-only access and secret masking.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/admin/admin-guard.test.ts src/test/features/admin/mask-secret.test.ts`
- [ ] Implement the shared guard and secret utility.
- [ ] Run the same test command and confirm PASS.

### Task 3: Models CRUD

**Files:**
- Create: `src/features/admin/models/validation.ts`
- Create: `src/features/admin/models/service.ts`
- Create: `src/app/api/admin/models/route.ts`
- Create: `src/app/api/admin/models/[id]/route.ts`
- Create: `src/app/(admin)/config/models/page.tsx`
- Create: `src/test/features/admin/models-validation.test.ts`
- Create: `src/test/features/admin/models-route.test.ts`
- Create: `src/test/integration/admin-models.integration.test.ts`

- [ ] Write failing tests for model validation, masking, default-model policy, update-without-new-secret and deletion side effects on supports.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/admin/models-validation.test.ts src/test/features/admin/models-route.test.ts src/test/integration/admin-models.integration.test.ts`
- [ ] Implement the model service, routes and page.
- [ ] Re-run the same test command and confirm PASS.

### Task 4: Agents CRUD

**Files:**
- Create: `src/features/admin/agents/validation.ts`
- Create: `src/features/admin/agents/service.ts`
- Create: `src/features/admin/agents/components/agent-form.tsx`
- Create: `src/app/api/admin/agents/route.ts`
- Create: `src/app/api/admin/agents/[id]/route.ts`
- Create: `src/app/(admin)/config/agents/page.tsx`
- Create: `src/app/(admin)/config/agents/new/page.tsx`
- Create: `src/app/(admin)/config/agents/[id]/edit/page.tsx`
- Create: `src/test/features/admin/agents-validation.test.ts`
- Create: `src/test/features/admin/agents-route.test.ts`
- Create: `src/test/features/admin/agent-form.test.tsx`
- Create: `src/test/integration/admin-agents.integration.test.ts`

- [ ] Write failing tests for agent validation, version handling, create/edit flows and enable/disable behavior.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/admin/agents-validation.test.ts src/test/features/admin/agents-route.test.ts src/test/features/admin/agent-form.test.tsx src/test/integration/admin-agents.integration.test.ts`
- [ ] Implement the agent service, routes, form and pages.
- [ ] Re-run the same test command and confirm PASS.

### Task 5: Supports CRUD

**Files:**
- Create: `src/features/admin/supports/validation.ts`
- Create: `src/features/admin/supports/service.ts`
- Create: `src/app/api/admin/supports/route.ts`
- Create: `src/app/api/admin/supports/[id]/route.ts`
- Create: `src/app/(admin)/config/supports/page.tsx`
- Create: `src/test/features/admin/supports-validation.test.ts`
- Create: `src/test/features/admin/supports-route.test.ts`
- Create: `src/test/integration/admin-supports.integration.test.ts`

- [ ] Write failing tests for support validation, joins, enabled-only dependencies and invalid model/agent linking.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/admin/supports-validation.test.ts src/test/features/admin/supports-route.test.ts src/test/integration/admin-supports.integration.test.ts`
- [ ] Implement the support service, routes and page.
- [ ] Re-run the same test command and confirm PASS.

### Task 6: Subjects and grade levels CRUD

**Files:**
- Create: `src/features/admin/curriculum/validation.ts`
- Create: `src/features/admin/curriculum/service.ts`
- Create: `src/app/api/admin/subjects/route.ts`
- Create: `src/app/api/admin/subjects/[id]/route.ts`
- Create: `src/app/api/admin/grade-levels/route.ts`
- Create: `src/app/api/admin/grade-levels/[id]/route.ts`
- Create: `src/app/(admin)/config/subjects/page.tsx`
- Create: `src/app/(admin)/config/grade-levels/page.tsx`
- Create: `src/test/features/admin/curriculum-validation.test.ts`
- Create: `src/test/features/admin/curriculum-route.test.ts`
- Create: `src/test/integration/admin-curriculum.integration.test.ts`

- [ ] Write failing tests for subject/grade-level creation, enabled toggling and active-only propagation assumptions.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/admin/curriculum-validation.test.ts src/test/features/admin/curriculum-route.test.ts src/test/integration/admin-curriculum.integration.test.ts`
- [ ] Implement the curriculum service, routes and pages.
- [ ] Re-run the same test command and confirm PASS.

### Task 7: Admin shell and config landing

**Files:**
- Create: `src/features/admin/shared/catalog-page.tsx`
- Create: `src/features/admin/shared/entity-manager.tsx`
- Modify: `src/app/(admin)/layout.tsx`
- Modify: `src/app/(admin)/config/page.tsx`
- Create: `src/test/features/admin/admin-layout.test.tsx`
- Create: `src/test/features/admin/config-home.test.tsx`
- Create: `src/test/features/admin/config-home.a11y.test.tsx`

- [ ] Write failing tests for admin layout access control, config navigation cards and critical accessibility semantics.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/admin/admin-layout.test.tsx src/test/features/admin/config-home.test.tsx`
- [ ] Implement the layout and landing using existing app-shell/design-system primitives.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:a11y -- src/test/features/admin/config-home.a11y.test.tsx`
- [ ] Fix any accessibility issues until PASS.

### Task 8: Agent evolution flow

**Files:**
- Create: `src/features/admin/agents/evolution/contracts.ts`
- Create: `src/features/admin/agents/evolution/validation.ts`
- Create: `src/features/admin/agents/evolution/service.ts`
- Create: `src/features/admin/agents/evolution/components/feedback-selector.tsx`
- Create: `src/features/admin/agents/evolution/components/prompt-comparator.tsx`
- Create: `src/app/api/admin/agents/[id]/feedbacks/route.ts`
- Create: `src/app/api/admin/agents/[id]/evolve/route.ts`
- Create: `src/app/(admin)/config/agents/[id]/evolve/page.tsx`
- Create: `src/test/features/admin/agent-evolution-validation.test.ts`
- Create: `src/test/features/admin/agent-evolution-route.test.ts`
- Create: `src/test/features/admin/feedback-selector.test.tsx`
- Create: `src/test/features/admin/prompt-comparator.test.tsx`
- Create: `src/test/integration/admin-agent-evolution.integration.test.ts`

- [ ] Write failing tests for eligible feedback loading, Mastra evolution request, accept/reject handling and `agent_evolutions` persistence.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/admin/agent-evolution-validation.test.ts src/test/features/admin/agent-evolution-route.test.ts src/test/features/admin/feedback-selector.test.tsx src/test/features/admin/prompt-comparator.test.tsx src/test/integration/admin-agent-evolution.integration.test.ts`
- [ ] Implement the evolution service, routes, comparison UI and decision flow.
- [ ] Re-run the same test command and confirm PASS.

### Task 9: End-to-end admin coverage

**Files:**
- Create: `e2e/admin-config.spec.ts`

- [ ] Write E2E coverage for the config landing and at least one CRUD/evolution happy path, respecting the accepted auth-infra skips if needed.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx playwright test e2e/admin-config.spec.ts --project=chromium`
- [ ] Stabilize fixtures and rerun the same command until PASS or intentional SKIP behavior.

### Task 10: Final validation

**Files:**
- Modify: any touched files above

- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run lint`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run typecheck`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:a11y`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:e2e`
- [ ] Document any accepted Phase 9 debt in `docs/technical-debt/` if discovered during execution.
