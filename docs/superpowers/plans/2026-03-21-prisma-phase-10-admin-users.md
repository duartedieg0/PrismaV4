# Prisma Phase 10 Admin Users Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** entregar a gestão administrativa completa de usuários com bloqueio, desbloqueio, mudança de papel e auditoria persistida.

**Architecture:** a fase adiciona uma trilha de auditoria própria e um módulo `features/admin/users`, apoiado por rotas administrativas e pela camada de access control já existente. O efeito operacional de `blocked` e `role` permanece centralizado em `profiles`, para manter a decisão de acesso única.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase, Vitest, Playwright

---

## File Map

- Create: `supabase/migrations/00010_admin_user_audit.sql`
- Create: `src/features/admin/users/contracts.ts`
- Create: `src/features/admin/users/validation.ts`
- Create: `src/features/admin/users/service.ts`
- Create: `src/features/admin/users/components/users-table.tsx`
- Create: `src/features/admin/users/components/user-governance-dialog.tsx`
- Create: `src/features/admin/audit/contracts.ts`
- Create: `src/features/admin/audit/service.ts`
- Create: `src/app/(admin)/users/page.tsx`
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/route.ts`
- Create: `src/test/features/admin/users-contracts.test.ts`
- Create: `src/test/features/admin/users-validation.test.ts`
- Create: `src/test/features/admin/users-route.test.ts`
- Create: `src/test/features/admin/users-page.test.tsx`
- Create: `src/test/features/admin/users-page.a11y.test.tsx`
- Create: `src/test/integration/admin-users.integration.test.ts`
- Create: `e2e/admin-users.spec.ts`

### Task 1: Schema and governance contracts

**Files:**
- Create: `supabase/migrations/00010_admin_user_audit.sql`
- Create: `src/features/admin/users/contracts.ts`
- Create: `src/features/admin/audit/contracts.ts`
- Create: `src/test/features/admin/users-contracts.test.ts`

- [ ] Write failing tests for `AdminUserListItem`, `UserGovernanceAction` and `AuditEntry`.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/admin/users-contracts.test.ts`
- [ ] Implement the migration and contracts.
- [ ] Run the same test command and confirm PASS.

### Task 2: Validation and governance service

**Files:**
- Create: `src/features/admin/users/validation.ts`
- Create: `src/features/admin/users/service.ts`
- Create: `src/features/admin/audit/service.ts`
- Create: `src/test/features/admin/users-validation.test.ts`
- Create: `src/test/integration/admin-users.integration.test.ts`

- [ ] Write failing tests for block/unblock validation, role changes, self-block prevention and last-admin protection.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/admin/users-validation.test.ts src/test/integration/admin-users.integration.test.ts`
- [ ] Implement the governance and audit services.
- [ ] Re-run the same test command and confirm PASS.

### Task 3: Admin users routes

**Files:**
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/route.ts`
- Create: `src/test/features/admin/users-route.test.ts`

- [ ] Write failing tests for list, invalid payload, self-block rejection, last-admin rejection, update success and audit persistence.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/admin/users-route.test.ts`
- [ ] Implement the routes using the shared admin guard.
- [ ] Re-run the same test command and confirm PASS.

### Task 4: Users page and risk confirmation

**Files:**
- Create: `src/features/admin/users/components/users-table.tsx`
- Create: `src/features/admin/users/components/user-governance-dialog.tsx`
- Create: `src/app/(admin)/users/page.tsx`
- Create: `src/test/features/admin/users-page.test.tsx`
- Create: `src/test/features/admin/users-page.a11y.test.tsx`

- [ ] Write failing UI tests for user list rendering, risk confirmation, block/unblock and role update flows.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- src/test/features/admin/users-page.test.tsx`
- [ ] Implement the page and components with the existing admin shell.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:a11y -- src/test/features/admin/users-page.a11y.test.tsx`
- [ ] Fix any accessibility issues until PASS.

### Task 5: End-to-end governance flow

**Files:**
- Create: `e2e/admin-users.spec.ts`

- [ ] Write the E2E scenario for unauthenticated redirect and at least one admin-governance entry flow.
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx playwright test e2e/admin-users.spec.ts --project=chromium`
- [ ] Stabilize fixtures and rerun until PASS or intentional SKIP behavior.

### Task 6: Final validation

**Files:**
- Modify: any touched files above

- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run lint`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run typecheck`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:a11y`
- [ ] Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:e2e`
