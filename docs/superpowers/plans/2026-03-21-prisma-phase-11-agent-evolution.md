# Prisma Phase 11 Agent Evolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** migrar a evolução de agentes para um workflow Mastra completo, com rastreabilidade de versão e resolução administrativa segura.

**Architecture:** a fase adiciona um workflow Mastra dedicado para evolução de prompts e faz a rota admin reaproveitar a superfície já existente, trocando a geração ad hoc por um serviço `runAgentEvolution`. O aceite/rejeição continua em rotas Next.js, mas passa a registrar melhor a ligação entre proposta, decisão e versão ativa do agente.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase, Mastra, Vitest, Playwright

---

## File Map

- Create: `src/mastra/contracts/evolution-contracts.ts`
- Create: `src/mastra/prompts/evolution-prompt.ts`
- Create: `src/mastra/agents/agent-evolution-runner.ts`
- Create: `src/mastra/workflows/evolve-agent-workflow.ts`
- Create: `src/services/ai/run-agent-evolution.ts`
- Modify: `src/mastra/runtime.ts`
- Modify: `src/features/admin/agents/evolution/contracts.ts`
- Modify: `src/features/admin/agents/evolution/service.ts`
- Modify: `src/app/api/admin/agents/[id]/evolve/route.ts`
- Modify: `src/app/api/admin/agents/[id]/feedbacks/route.ts`
- Create: `supabase/migrations/00011_agent_evolution_versioning.sql`
- Modify: `src/gateways/supabase/schema-baseline.ts`
- Create: `src/test/mastra/evolution-contracts.test.ts`
- Create: `src/test/mastra/evolution-prompt.test.ts`
- Create: `src/test/mastra/agent-evolution-runner.test.ts`
- Create: `src/test/mastra/evolve-agent-workflow.test.ts`
- Create: `src/test/services/run-agent-evolution.test.ts`
- Modify: `src/test/features/admin/agent-evolution-route.test.ts`
- Modify: `src/test/integration/admin-agent-evolution.integration.test.ts`
- Create or Modify: `src/test/features/admin/evolve-agent-page.test.tsx`
- Create or Modify: `src/test/features/admin/evolve-agent-page.a11y.test.tsx`
- Create or Modify: `e2e/admin-agent-evolution.spec.ts`

### Task 1: Runtime contracts and prompt module

**Files:**
- Create: `src/mastra/contracts/evolution-contracts.ts`
- Create: `src/mastra/prompts/evolution-prompt.ts`
- Create: `src/test/mastra/evolution-contracts.test.ts`
- Create: `src/test/mastra/evolution-prompt.test.ts`

- [ ] Write failing tests for evolution workflow input/output and prompt version metadata.
- [ ] Write a failing test for prompt assembly from agent name, objective, current prompt and selected feedbacks.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/mastra/evolution-contracts.test.ts src/test/mastra/evolution-prompt.test.ts`
- [ ] Implement the minimal contracts and prompt module.
- [ ] Run the same command and confirm PASS.

### Task 2: Agent runner and workflow

**Files:**
- Create: `src/mastra/agents/agent-evolution-runner.ts`
- Create: `src/mastra/workflows/evolve-agent-workflow.ts`
- Modify: `src/mastra/runtime.ts`
- Create: `src/test/mastra/agent-evolution-runner.test.ts`
- Create: `src/test/mastra/evolve-agent-workflow.test.ts`

- [ ] Write failing tests for structured output parsing, invalid runtime payloads and workflow persistence handoff.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/mastra/agent-evolution-runner.test.ts src/test/mastra/evolve-agent-workflow.test.ts`
- [ ] Implement the runner and workflow with runtime metadata aligned to the existing Mastra runtime.
- [ ] Register the workflow in the runtime factory.
- [ ] Run the same command and confirm PASS.

### Task 3: Application service integration

**Files:**
- Create: `src/services/ai/run-agent-evolution.ts`
- Modify: `src/features/admin/agents/evolution/service.ts`
- Create: `src/test/services/run-agent-evolution.test.ts`
- Modify: `src/test/integration/admin-agent-evolution.integration.test.ts`

- [ ] Write failing tests for invoking the workflow and normalizing a valid suggestion.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/services/run-agent-evolution.test.ts src/test/integration/admin-agent-evolution.integration.test.ts`
- [ ] Implement `runAgentEvolution` and refactor the admin evolution service to use it instead of direct `generateText`.
- [ ] Run the same command and confirm PASS.

### Task 4: Schema versioning and acceptance traceability

**Files:**
- Create: `supabase/migrations/00011_agent_evolution_versioning.sql`
- Modify: `src/gateways/supabase/schema-baseline.ts`

- [ ] Write failing tests or baseline assertions for the new schema expectations around accepted version metadata.
- [ ] Create the migration to persist accepted prompt version metadata needed by this phase.
- [ ] Update the schema baseline list/assertions.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/gateways/schema-baseline.test.ts src/test/gateways/supabase-filesystem.test.ts`
- [ ] Confirm PASS.

### Task 5: Admin route refactor

**Files:**
- Modify: `src/app/api/admin/agents/[id]/evolve/route.ts`
- Modify: `src/app/api/admin/agents/[id]/feedbacks/route.ts`
- Modify: `src/features/admin/agents/evolution/contracts.ts`
- Modify: `src/test/features/admin/agent-evolution-route.test.ts`

- [ ] Write failing route tests for workflow-backed suggestion generation and accepted/rejected resolution with version tracking.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/admin/agent-evolution-route.test.ts`
- [ ] Refactor the routes to call the new service and persist accepted-version metadata when the suggestion is promoted.
- [ ] Ensure feedback listing reflects used/resolved evolution history consistently.
- [ ] Run the same command and confirm PASS.

### Task 6: Admin UI verification

**Files:**
- Create or Modify: `src/test/features/admin/evolve-agent-page.test.tsx`
- Create or Modify: `src/test/features/admin/evolve-agent-page.a11y.test.tsx`
- Modify as needed: `src/app/(admin)/config/agents/[id]/evolve/page.tsx`
- Modify as needed: `src/features/admin/agents/evolution/components/prompt-comparator.tsx`

- [ ] Write failing UI tests for generating a proposal, comparing prompts and resolving acceptance/rejection.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/admin/evolve-agent-page.test.tsx`
- [ ] Implement any UI adjustments required by the new response shape and resolution metadata.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:a11y -- src/test/features/admin/evolve-agent-page.a11y.test.tsx`
- [ ] Fix any accessibility issues until PASS.

### Task 7: End-to-end evolution journey

**Files:**
- Create or Modify: `e2e/admin-agent-evolution.spec.ts`

- [ ] Write the E2E scenario for selecting feedbacks, generating a suggestion and accepting or rejecting it.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:e2e -- e2e/admin-agent-evolution.spec.ts`
- [ ] Adjust fixtures/guards only as needed to respect the accepted authenticated-infra skips.
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
- [ ] Document any accepted Phase 11 debt in `docs/technical-debt/` if discovered during execution.
