# Prisma Phase 12 Rollout, Hardening and User-Testing Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** deixar o `PrismaV2` pronto para testes com usuários, com readiness check executável, playbooks operacionais e critérios explícitos de release.

**Architecture:** a fase adiciona uma camada operacional mínima ao repositório: um script `readiness`, documentação versionada em `docs/release/` e testes leves que garantem a presença e consistência desses artefatos. O código de produto não muda de comportamento funcional; o foco é readiness, rollout e hardening do programa.

**Tech Stack:** Node.js 22, Next.js 16, TypeScript, Vitest, filesystem docs

---

## File Map

- Create: `scripts/readiness-check.mjs`
- Create: `docs/release/README.md`
- Create: `docs/release/release-checklist.md`
- Create: `docs/release/rollout-playbook.md`
- Create: `docs/release/rollback-playbook.md`
- Create: `docs/release/regression-matrix.md`
- Create: `docs/release/user-testing-playbook.md`
- Create: `src/test/features/release/readiness-check.test.ts`
- Create: `src/test/features/release/release-docs.test.ts`
- Modify: `package.json`
- Modify: `README.md`

### Task 1: Readiness check contract

**Files:**
- Create: `src/test/features/release/readiness-check.test.ts`
- Create: `scripts/readiness-check.mjs`

- [ ] Write failing tests for Node baseline detection, required env detection, optional warning handling and migration baseline validation.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/release/readiness-check.test.ts`
- [ ] Implement the readiness script with deterministic output and non-zero exit on blocking failures.
- [ ] Run the same command and confirm PASS.

### Task 2: Release documentation set

**Files:**
- Create: `docs/release/README.md`
- Create: `docs/release/release-checklist.md`
- Create: `docs/release/rollout-playbook.md`
- Create: `docs/release/rollback-playbook.md`
- Create: `docs/release/regression-matrix.md`
- Create: `docs/release/user-testing-playbook.md`
- Create: `src/test/features/release/release-docs.test.ts`

- [ ] Write failing tests that assert the presence of all operational docs.
- [ ] Run: `PATH=\"/opt/homebrew/opt/node@22/bin:$PATH\" npm run test -- src/test/features/release/release-docs.test.ts`
- [ ] Add the release docs with explicit rollout, rollback, regression and user-testing guidance.
- [ ] Run the same command and confirm PASS.

### Task 3: Repository entry points

**Files:**
- Modify: `package.json`
- Modify: `README.md`

- [ ] Write or adjust failing assertions if needed for the new `readiness` script and operational README content.
- [ ] Add `npm run readiness` and document the full readiness path in `README.md`.
- [ ] Ensure README points users to the release docs and accepted known limitations.
- [ ] Run: `PATH=\"/opt/homebrew/opt/node@22/bin:$PATH\" node scripts/readiness-check.mjs`
- [ ] Confirm the script exits successfully in the current environment.

### Task 4: Final validation

**Files:**
- Modify: any touched files above

- [ ] Run: `PATH=\"/opt/homebrew/opt/node@22/bin:$PATH\" npm run readiness`
- [ ] Run: `PATH=\"/opt/homebrew/opt/node@22/bin:$PATH\" npm run lint`
- [ ] Run: `PATH=\"/opt/homebrew/opt/node@22/bin:$PATH\" npm run typecheck`
- [ ] Run: `PATH=\"/opt/homebrew/opt/node@22/bin:$PATH\" npm run build`
- [ ] Run: `PATH=\"/opt/homebrew/opt/node@22/bin:$PATH\" npm run test`
- [ ] Run: `PATH=\"/opt/homebrew/opt/node@22/bin:$PATH\" npm run test:a11y`
- [ ] Run: `PATH=\"/opt/homebrew/opt/node@22/bin:$PATH\" npm run test:e2e`
- [ ] Document any remaining accepted operational risks in `docs/technical-debt/` only if a new one is discovered.
