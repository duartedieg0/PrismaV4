# Prisma Phase 2 Auth and Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** implement centralized SSR authentication, authorization and user lifecycle routing so public, teacher, admin and blocked flows resolve through a single testable access layer.

**Architecture:** keep Supabase SSR as the source of truth, but move session resolution, profile resolution and access decisions into focused feature modules under `src/features/auth`, `src/features/access-control` and `src/features/user-lifecycle`. Route entry points (`proxy.ts`, login, callback, logout and guarded pages) consume these services instead of checking cookies or roles ad hoc.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase SSR, TypeScript 5, Vitest, Playwright, Zod

---

### Task 1: Define auth and access contracts

**Files:**
- Modify: `src/features/auth/contracts.ts`
- Modify: `src/features/access-control/contracts.ts`
- Modify: `src/features/user-lifecycle/contracts.ts`
- Modify: `src/test/features/auth/contracts.test.ts`

- [ ] **Step 1: Write the failing contract tests**

Cover:
- `AuthenticatedUser`
- `AccessDecision`
- `BlockedUserState`
- helper defaults and union guards for `public`, `teacher`, `admin`, `blocked`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- src/test/features/auth/contracts.test.ts`
Expected: FAIL because the current contract surface is incomplete for the Phase 2 requirements.

- [ ] **Step 3: Implement the minimal contract modules**

Export the typed objects and helper builders used by auth/access services. Reuse the existing `Profile` and `UserRole` domain contracts instead of duplicating them.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- src/test/features/auth/contracts.test.ts`
Expected: PASS.

### Task 2: Centralize session, profile and access decisions

**Files:**
- Create: `src/features/auth/get-authenticated-user.ts`
- Create: `src/features/auth/get-profile.ts`
- Create: `src/features/access-control/access-policy.ts`
- Create: `src/features/access-control/assert-access.ts`
- Create: `src/test/features/auth/access-policy.test.ts`
- Create: `src/test/features/auth/get-profile.test.ts`
- Create: `src/test/integration/auth-access.integration.test.ts`

- [ ] **Step 1: Write the failing service tests**

Cover:
- session absent;
- profile absent;
- token expired / invalid session exchange;
- blocked user;
- teacher route;
- admin-only route;
- public route with redirect for authenticated users.
- assert both redirect destination and deterministic reason/message payload.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:
- `npm run test -- src/test/features/auth/access-policy.test.ts`
- `npm run test -- src/test/features/auth/get-profile.test.ts`
Expected: FAIL because the service modules do not exist yet.

- [ ] **Step 3: Implement the minimal auth/access services**

Add:
- `getAuthenticatedUser`
- `getProfileOrRedirect`
- `assertTeacherAccess`
- `assertAdminAccess`
- deterministic redirect destinations for missing session, missing profile, blocked user and role mismatch.
- deterministic reason/message payloads for missing session, missing profile, expired token, blocked user and role mismatch.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:
- `npm run test -- src/test/features/auth/access-policy.test.ts`
- `npm run test -- src/test/features/auth/get-profile.test.ts`
- `npm run test -- src/test/integration/auth-access.integration.test.ts`
Expected: PASS.

### Task 3: Replace route gating with a Next.js 16 proxy

**Files:**
- Create: `proxy.ts`
- Modify: `tsconfig.json`
- Modify: `src/gateways/supabase/middleware.ts`
- Create: `src/test/features/auth/proxy.test.ts`

- [ ] **Step 1: Write the failing proxy tests**

Cover route classes:
- `/`, `/login`, `/blocked`, `/logout`, `/login/callback` as public;
- `/dashboard` as teacher;
- `/config`, `/users`, `/api/admin/*` as admin;
- blocked-user redirect precedence.

- [ ] **Step 2: Run the proxy tests to verify they fail**

Run: `npm run test -- src/test/features/auth/proxy.test.ts`
Expected: FAIL because the proxy and explicit access routing do not exist yet.

- [ ] **Step 3: Implement the proxy and middleware handoff**

Use Next.js 16 `proxy.ts` and explicit matcher configuration. Keep the middleware layer light: refresh session state, then delegate decision-making to the access-control service.
Update `tsconfig.json` so `proxy.ts` participates in the quality gate.

- [ ] **Step 4: Run the proxy tests to verify they pass**

Run: `npm run test -- src/test/features/auth/proxy.test.ts`
Expected: PASS.

### Task 4: Formalize login, callback, logout and blocked/public behavior

**Files:**
- Create: `src/app/(public)/login/page.tsx`
- Create: `src/app/login/callback/route.ts`
- Create: `src/app/(public)/logout/route.ts`
- Modify: `src/app/(public)/blocked/page.tsx`
- Modify: `src/app/(public)/page.tsx`
- Create: `src/test/features/auth/login-flow.test.tsx`
- Create: `e2e/auth-access.spec.ts`

- [ ] **Step 1: Write the failing UI and route tests**

Cover:
- login page triggers Google OAuth with callback URL;
- logout route signs out and clears auth cookies;
- blocked page stays accessible and informative;
- public landing redirects authenticated users to `/dashboard`.
- callback handling for missing `code`;
- failed `exchangeCodeForSession`;
- honoring `next`;
- blocked-user post-login redirect;
- teacher post-login redirect to `/dashboard`;
- admin post-login redirect to `/config`.

- [ ] **Step 2: Run the tests to verify they fail**

Run:
- `npm run test -- src/test/features/auth/login-flow.test.tsx`
Expected: FAIL because the login/callback/logout flow is not implemented yet.

- [ ] **Step 3: Implement the minimal login/callback/logout flow**

Use the centralized auth services. Do not place authorization logic inside the page components beyond delegating to the access layer.

- [ ] **Step 4: Add E2E auth-access smoke coverage**

Create Playwright coverage for:
- unauthenticated access redirect;
- public login page;
- blocked route;
- admin route redirect behavior;
- logout redirect behavior.

- [ ] **Step 5: Run the full quality gate for Phase 2**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:a11y`
- `npm run test:e2e`

Expected: all PASS.
