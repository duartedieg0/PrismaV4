# Prisma Phase 7 Pre Req Node Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** alinhar o PrismaV2 a Node 22.13+ para suportar o runtime Mastra e preservar a integridade das fases já concluídas.

**Architecture:** esta é uma fase de plataforma. O foco é declarar o requisito de runtime do projeto, alinhar CI e documentação, e rerodar o gate completo após a atualização local do Node.

**Tech Stack:** Node.js, npm, GitHub Actions, Next.js 16, Mastra

---

## File Map

- Modify: `package.json`
- Create: `.nvmrc`
- Create: `.node-version`
- Modify: `.github/workflows/ci.yml`
- Create: `README.md`
- Modify: `docs/plans/2026-03-21-prisma-phase-7-mastra-runtime-design.md`
- Modify: `docs/superpowers/plans/2026-03-21-prisma-phase-7-mastra-runtime.md`

### Task 1: Declare the runtime baseline

**Files:**
- Modify: `package.json`
- Create: `.nvmrc`
- Create: `.node-version`

- [ ] Add `engines.node` with the minimum supported runtime for Mastra.
- [ ] Add `.nvmrc` with the recommended local version.
- [ ] Add `.node-version` with the same value.
- [ ] Run: `npm run typecheck`

### Task 2: Align CI and docs

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `README.md`

- [ ] Update GitHub Actions to use the same Node baseline.
- [ ] Add short bootstrap instructions to `README.md`.
- [ ] Document that the Phase 7 runtime requires Node 22.13+.

### Task 3: Bind Phase 7 to the prereq

**Files:**
- Modify: `docs/plans/2026-03-21-prisma-phase-7-mastra-runtime-design.md`
- Modify: `docs/superpowers/plans/2026-03-21-prisma-phase-7-mastra-runtime.md`

- [ ] Note that the Mastra runtime phase depends on the prereq phase.
- [ ] Keep the implementation order explicit to avoid running Fase 7 in Node 20.

### Task 4: Validate after local Node upgrade

**Files:**
- Modify: any touched file above

- [ ] Switch the local environment to Node `22.13+`.
- [ ] Run: `npm run lint`
- [ ] Run: `npm run typecheck`
- [ ] Run: `npm run build`
- [ ] Run: `npm run test`
- [ ] Run: `npm run test:a11y`
- [ ] Run: `npm run test:e2e`
- [ ] Record any residual incompatibility before resuming Fase 7.
