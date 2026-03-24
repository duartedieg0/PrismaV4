# Prisma UI Prototype Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorientar o frontend do `PrismaV2` para a linguagem visual do protótipo de referência, mantendo backend e comportamento intactos.

**Architecture:** A execução começa pela fundação visual global, reestrutura os shells e então reaplica o novo padrão às telas públicas, do professor e administrativas. O foco é composição, tokens, hierarquia, spacing e acabamento das superfícies, não lógica de negócio.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS importado globalmente, design-system local, Vitest, Playwright

---

### File Map

**Foundation**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/design-system/tokens/semantic-tokens.ts`
- Modify: `src/design-system/tokens/layout.ts`
- Modify: `src/design-system/components/surface.tsx`
- Modify: `src/design-system/components/page-header.tsx`
- Modify: `src/design-system/components/status-badge.tsx`

**Shells**
- Modify: `src/app-shell/public/public-shell.tsx`
- Modify: `src/app-shell/authenticated/teacher-shell.tsx`
- Modify: `src/app-shell/admin/admin-shell.tsx`
- Modify: `src/design-system/components/brand-mark.tsx`
- Modify: `src/design-system/components/breadcrumbs.tsx`

**Landing and Public**
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/app/(public)/login/page.tsx`
- Modify: `src/app/(public)/blocked/page.tsx`
- Modify: `src/features/public-experience/components/public-hero.tsx`
- Modify: `src/features/public-experience/components/trust-strip.tsx`
- Modify: `src/features/public-experience/components/flow-section.tsx`
- Modify: `src/features/public-experience/components/benefits-section.tsx`
- Modify: `src/features/public-experience/components/public-faq.tsx`
- Modify: `src/features/public-experience/components/final-cta.tsx`
- Modify: `src/features/public-experience/components/public-footer.tsx`

**Teacher**
- Modify: `src/app/(auth)/dashboard/page.tsx`
- Modify: `src/features/exams/dashboard/components/*.tsx`
- Modify: `src/app/(auth)/exams/new/page.tsx`
- Modify: `src/features/exams/create/components/*.tsx`
- Modify: `src/app/(auth)/exams/[id]/processing/page.tsx`
- Modify: `src/app/(auth)/exams/[id]/extraction/page.tsx`
- Modify: `src/app/(auth)/exams/[id]/result/page.tsx`
- Modify: `src/features/exams/extraction/components/*.tsx`
- Modify: `src/features/exams/results/components/*.tsx`

**Admin**
- Modify: `src/app/(admin)/config/page.tsx`
- Modify: `src/app/(admin)/users/page.tsx`
- Modify: `src/features/admin/shared/*.tsx`
- Modify: `src/features/admin/users/components/*.tsx`
- Modify: `src/features/admin/agents/components/agent-form.tsx`
- Modify: `src/features/admin/agents/evolution/components/*.tsx`

### Task 1: Rebase the visual foundation to the prototype language

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/design-system/tokens/semantic-tokens.ts`
- Modify: `src/design-system/tokens/layout.ts`
- Modify: `src/design-system/components/surface.tsx`
- Modify: `src/design-system/components/page-header.tsx`
- Modify: `src/design-system/components/status-badge.tsx`

- [ ] **Step 1: Update palette, shadows, spacing and typography emphasis**
- [ ] **Step 2: Reduce glass effects and move to solid cards**
- [ ] **Step 3: Verify foundation compiles**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run typecheck`
Expected: PASS

### Task 2: Rebuild shell hierarchy around the prototype reference

**Files:**
- Modify: `src/app-shell/public/public-shell.tsx`
- Modify: `src/app-shell/authenticated/teacher-shell.tsx`
- Modify: `src/app-shell/admin/admin-shell.tsx`
- Modify: `src/design-system/components/brand-mark.tsx`
- Modify: `src/design-system/components/breadcrumbs.tsx`

- [ ] **Step 1: Make the public topbar compact and floating**
- [ ] **Step 2: Make teacher and admin shells lighter and clearer**
- [ ] **Step 3: Preserve accessibility names and existing navigation semantics**

### Task 3: Recompose the landing around hero, metrics and editorial CTA

**Files:**
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/app/(public)/login/page.tsx`
- Modify: `src/app/(public)/blocked/page.tsx`
- Modify: `src/features/public-experience/components/*.tsx`

- [ ] **Step 1: Rebuild hero into a stronger two-column presentation**
- [ ] **Step 2: Make metrics and capability cards closer to the prototype**
- [ ] **Step 3: Rework the final CTA and footer rhythm**

### Task 4: Align teacher flow screens to the new system

**Files:**
- Modify: `src/app/(auth)/dashboard/page.tsx`
- Modify: `src/features/exams/dashboard/components/*.tsx`
- Modify: `src/app/(auth)/exams/new/page.tsx`
- Modify: `src/features/exams/create/components/*.tsx`
- Modify: `src/app/(auth)/exams/[id]/processing/page.tsx`
- Modify: `src/app/(auth)/exams/[id]/extraction/page.tsx`
- Modify: `src/app/(auth)/exams/[id]/result/page.tsx`
- Modify: `src/features/exams/extraction/components/*.tsx`
- Modify: `src/features/exams/results/components/*.tsx`

- [ ] **Step 1: Make dashboard and creation flow feel like part of the same product**
- [ ] **Step 2: Rework extraction and result cards to the clearer solid-card system**
- [ ] **Step 3: Keep all existing test semantics intact**

### Task 5: Align the admin surfaces to the same family

**Files:**
- Modify: `src/app/(admin)/config/page.tsx`
- Modify: `src/app/(admin)/users/page.tsx`
- Modify: `src/features/admin/shared/*.tsx`
- Modify: `src/features/admin/users/components/*.tsx`
- Modify: `src/features/admin/agents/components/agent-form.tsx`
- Modify: `src/features/admin/agents/evolution/components/*.tsx`

- [ ] **Step 1: Make the admin console clearer, denser and less provisional**
- [ ] **Step 2: Improve table, dialog and form finish without changing behavior**
- [ ] **Step 3: Validate targeted tests if needed**

### Task 6: Run the full validation gate

**Files:**
- Modify docs only if final notes are needed

- [ ] **Step 1: Run lint**
- [ ] **Step 2: Run typecheck**
- [ ] **Step 3: Run build**
- [ ] **Step 4: Run tests**
- [ ] **Step 5: Run a11y tests**
- [ ] **Step 6: Run e2e tests**

Commands:
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run lint`
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run typecheck`
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build`
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test`
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:a11y`
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:e2e`

Expected: All PASS
