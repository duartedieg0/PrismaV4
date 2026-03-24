# Prisma Phase 7 Mastra Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** substituir os fluxos centrais de IA do PrismaV2 por um runtime Mastra explícito para extração e análise/adaptação.

**Architecture:** o app Next.js continua chamando serviços de domínio; esses serviços passam a invocar workflows Mastra. O runtime fica isolado em `src/mastra/`, com contratos, registry de modelos, tools, agents e workflows testáveis.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase, Mastra, Vitest, Playwright

**Prerequisite:** executar antes `docs/superpowers/plans/2026-03-21-prisma-phase-7-prereq-node-upgrade.md` e trocar o ambiente local para Node `22.13+`.

---

## File Map

- Create: `src/mastra/index.ts`
- Create: `src/mastra/contracts/runtime-contracts.ts`
- Create: `src/mastra/contracts/extraction-contracts.ts`
- Create: `src/mastra/contracts/adaptation-contracts.ts`
- Create: `src/mastra/observability/runtime-events.ts`
- Create: `src/mastra/observability/runtime-logger.ts`
- Create: `src/mastra/prompts/extraction-prompt.ts`
- Create: `src/mastra/prompts/bncc-prompt.ts`
- Create: `src/mastra/prompts/bloom-prompt.ts`
- Create: `src/mastra/prompts/adaptation-prompt.ts`
- Create: `src/mastra/providers/model-registry.ts`
- Create: `src/mastra/providers/provider-factory.ts`
- Create: `src/mastra/tools/load-exam-context-tool.ts`
- Create: `src/mastra/tools/persist-extraction-tool.ts`
- Create: `src/mastra/tools/persist-adaptations-tool.ts`
- Create: `src/mastra/tools/register-runtime-event-tool.ts`
- Create: `src/mastra/agents/extraction-agent.ts`
- Create: `src/mastra/agents/bncc-analysis-agent.ts`
- Create: `src/mastra/agents/bloom-analysis-agent.ts`
- Create: `src/mastra/agents/adaptation-agent.ts`
- Create: `src/mastra/workflows/extract-exam-workflow.ts`
- Create: `src/mastra/workflows/analyze-and-adapt-workflow.ts`
- Create: `src/services/ai/run-extraction.ts`
- Create: `src/services/ai/run-analysis-and-adaptation.ts`
- Modify: `src/features/exams/extraction/process-extraction.ts`
- Modify: `src/features/exams/extraction/legacy-extraction.ts` or replace usage path if no longer needed
- Modify: `src/app/api/exams/[id]/answers/route.ts`
- Modify: `package.json`
- Test: `src/test/mastra/runtime-contracts.test.ts`
- Test: `src/test/mastra/model-registry.test.ts`
- Test: `src/test/mastra/extract-exam-workflow.test.ts`
- Test: `src/test/mastra/analyze-and-adapt-workflow.test.ts`
- Test: `src/test/services/run-extraction.test.ts`
- Test: `src/test/services/run-analysis-and-adaptation.test.ts`
- Test: `src/test/features/exams/extraction/process-extraction.test.ts`
- Test: `src/test/features/exams/extraction/submit-answers-route.test.ts`

### Task 1: Install and bootstrap Mastra

**Files:**
- Modify: `package.json`
- Create: `src/mastra/index.ts`

- [ ] Check installed dependencies and confirm `@mastra/*` is currently absent.
- [ ] Add the minimal Mastra packages required for agents/workflows/providers.
- [ ] Run the install and verify the lockfile updates cleanly.
- [ ] Create `src/mastra/index.ts` as the single runtime export surface.
- [ ] Run: `npm run typecheck`

### Task 2: Runtime contracts and observability primitives

**Files:**
- Create: `src/mastra/contracts/runtime-contracts.ts`
- Create: `src/mastra/contracts/extraction-contracts.ts`
- Create: `src/mastra/contracts/adaptation-contracts.ts`
- Create: `src/mastra/observability/runtime-events.ts`
- Create: `src/mastra/observability/runtime-logger.ts`
- Test: `src/test/mastra/runtime-contracts.test.ts`

- [ ] Write failing tests for runtime contract creation and failure semantics.
- [ ] Implement extraction/adaptation input-output contracts.
- [ ] Implement trace metadata helpers using the existing correlation id conventions.
- [ ] Implement the runtime logger bridge.
- [ ] Run the targeted tests.

### Task 3: Model registry and provider resolution

**Files:**
- Create: `src/mastra/providers/model-registry.ts`
- Create: `src/mastra/providers/provider-factory.ts`
- Test: `src/test/mastra/model-registry.test.ts`

- [ ] Write failing tests for default model resolution, support-specific override, disabled model rejection and fallback behavior.
- [ ] Implement the registry contract over `ai_models`, `supports` and `exam_supports`.
- [ ] Implement provider creation based on the current installed Mastra API.
- [ ] Run the targeted tests.

### Task 4: Prompt modules and Mastra agents

**Files:**
- Create: `src/mastra/prompts/extraction-prompt.ts`
- Create: `src/mastra/prompts/bncc-prompt.ts`
- Create: `src/mastra/prompts/bloom-prompt.ts`
- Create: `src/mastra/prompts/adaptation-prompt.ts`
- Create: `src/mastra/agents/extraction-agent.ts`
- Create: `src/mastra/agents/bncc-analysis-agent.ts`
- Create: `src/mastra/agents/bloom-analysis-agent.ts`
- Create: `src/mastra/agents/adaptation-agent.ts`

- [ ] Lift the current product prompts from the legacy functions into versioned prompt modules.
- [ ] Create Mastra agents that wrap those prompts and the resolved model.
- [ ] Keep prompt ownership/version fields explicit in runtime metadata.
- [ ] Run: `npm run typecheck`

### Task 5: Supabase tools for runtime IO

**Files:**
- Create: `src/mastra/tools/load-exam-context-tool.ts`
- Create: `src/mastra/tools/persist-extraction-tool.ts`
- Create: `src/mastra/tools/persist-adaptations-tool.ts`
- Create: `src/mastra/tools/register-runtime-event-tool.ts`

- [ ] Implement the read-side tool for exam, questions, supports and models.
- [ ] Implement the extraction persistence tool for questions, warnings and status changes.
- [ ] Implement the adaptation persistence tool for BNCC, Bloom, adaptation rows and progress updates.
- [ ] Implement the runtime event registration tool using the existing logger foundation.
- [ ] Run: `npm run typecheck`

### Task 6: Extract exam workflow

**Files:**
- Create: `src/mastra/workflows/extract-exam-workflow.ts`
- Test: `src/test/mastra/extract-exam-workflow.test.ts`
- Modify: `src/services/ai/run-extraction.ts`
- Modify: `src/features/exams/extraction/process-extraction.ts`

- [ ] Write failing workflow tests for success, no questions found, model missing and persistence failure.
- [ ] Implement `extractExamWorkflow` with the current installed Mastra workflow API.
- [ ] Wire the extraction service to call the workflow instead of the legacy gateway.
- [ ] Keep the Phase 6 normalization and status semantics intact.
- [ ] Run the targeted tests.

### Task 7: Analyze and adapt workflow

**Files:**
- Create: `src/mastra/workflows/analyze-and-adapt-workflow.ts`
- Create: `src/services/ai/run-analysis-and-adaptation.ts`
- Test: `src/test/mastra/analyze-and-adapt-workflow.test.ts`
- Test: `src/test/services/run-analysis-and-adaptation.test.ts`
- Modify: `src/app/api/exams/[id]/answers/route.ts`
- Modify: `src/test/features/exams/extraction/submit-answers-route.test.ts`

- [ ] Write failing tests for loading context, creating pending adaptations, generating BNCC/Bloom/adaptations and final status updates.
- [ ] Implement `analyzeAndAdaptWorkflow`.
- [ ] Replace the route-level invocation of the legacy Edge Function with the new runtime service.
- [ ] Preserve the existing API contract and user-facing error messages where still applicable.
- [ ] Run the targeted tests.

### Task 8: Runtime integration hardening

**Files:**
- Modify: `src/mastra/index.ts`
- Modify: `src/services/ai/run-extraction.ts`
- Modify: `src/services/ai/run-analysis-and-adaptation.ts`
- Test: `src/test/services/run-extraction.test.ts`

- [ ] Add integration-friendly seams for mocking workflows in Vitest.
- [ ] Ensure runtime errors map to the existing product error taxonomy.
- [ ] Remove or quarantine legacy gateway code that is no longer on the main path.
- [ ] Run the targeted tests.

### Task 9: Final validation

**Files:**
- Modify: any touched files above

- [ ] Run: `npm run lint`
- [ ] Run: `npm run typecheck`
- [ ] Run: `npm run build`
- [ ] Run: `npm run test`
- [ ] Run: `npm run test:a11y`
- [ ] Run: `npm run test:e2e`
- [ ] Update the Phase 7 plan with any accepted runtime-specific debt discovered during execution.

## Accepted Debt

- manter temporariamente `src/features/exams/extraction/process-extraction.ts` e `src/gateways/extraction/legacy-extraction.ts` apenas como compat layer de regressão, fora da trilha principal;
- remover essa superfície depois da estabilização do runtime Mastra, conforme `docs/technical-debt/2026-03-21-phase-7-remove-legacy-extraction-compat.md`.
