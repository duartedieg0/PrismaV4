# Prisma UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar o layout e o design de todas as telas do `PrismaV2` sem alterar backend, fluxos de negócio ou contratos de dados.

**Architecture:** A refatoração começa pela fundação visual compartilhada, segue pelos shells e componentes estruturais e só então reaplica o novo sistema visual nas telas públicas, do professor e administrativas. O comportamento do produto permanece o mesmo; mudam apenas composição, estilo, hierarquia e consistência visual.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS, design-system local, Vitest, Playwright

---

### File Map

**Foundation**
- Modify: `src/app/globals.css`
- Modify: `src/design-system/tokens/semantic-tokens.ts`
- Modify: `src/design-system/tokens/layout.ts`
- Modify: `src/design-system/typography/fonts.ts`

**Shared Components and Shells**
- Modify: `src/design-system/components/page-header.tsx`
- Modify: `src/design-system/components/surface.tsx`
- Modify: `src/design-system/components/section-shell.tsx`
- Modify: `src/design-system/components/status-badge.tsx`
- Modify: `src/design-system/components/empty-state.tsx`
- Modify: `src/design-system/components/error-state.tsx`
- Modify: `src/design-system/components/loading-state.tsx`
- Modify: `src/design-system/components/processing-banner.tsx`
- Modify: `src/design-system/components/data-table-wrapper.tsx`
- Modify: `src/design-system/components/brand-mark.tsx`
- Modify: `src/app-shell/public/public-shell.tsx`
- Modify: `src/app-shell/authenticated/teacher-shell.tsx`
- Modify: `src/app-shell/admin/admin-shell.tsx`

**Public Surfaces**
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/app/(public)/login/page.tsx`
- Modify: `src/app/(public)/blocked/page.tsx`
- Modify: `src/features/public-experience/components/*.tsx`

**Teacher Surfaces**
- Modify: `src/app/(auth)/dashboard/page.tsx`
- Modify: `src/features/exams/dashboard/components/*.tsx`
- Modify: `src/app/(auth)/exams/new/page.tsx`
- Modify: `src/features/exams/create/components/*.tsx`
- Modify: `src/app/(auth)/exams/[id]/processing/page.tsx`
- Modify: `src/app/(auth)/exams/[id]/extraction/page.tsx`
- Modify: `src/app/(auth)/exams/[id]/result/page.tsx`
- Modify: `src/features/exams/extraction/components/*.tsx`
- Modify: `src/features/exams/results/components/*.tsx`

**Admin Surfaces**
- Modify: `src/app/(admin)/config/page.tsx`
- Modify: `src/app/(admin)/config/models/page.tsx`
- Modify: `src/app/(admin)/config/agents/page.tsx`
- Modify: `src/app/(admin)/config/agents/new/page.tsx`
- Modify: `src/app/(admin)/config/agents/[id]/edit/page.tsx`
- Modify: `src/app/(admin)/config/agents/[id]/evolve/page.tsx`
- Modify: `src/app/(admin)/config/supports/page.tsx`
- Modify: `src/app/(admin)/config/subjects/page.tsx`
- Modify: `src/app/(admin)/config/grade-levels/page.tsx`
- Modify: `src/app/(admin)/users/page.tsx`
- Modify: `src/features/admin/shared/*.tsx`
- Modify: `src/features/admin/agents/components/*.tsx`
- Modify: `src/features/admin/agents/evolution/components/*.tsx`
- Modify: `src/features/admin/users/components/*.tsx`

**Tests**
- Run existing suites and update snapshots/assertions only if the semantic contract changed visually but not behaviorally

### Task 1: Refine the visual foundation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/design-system/tokens/semantic-tokens.ts`
- Modify: `src/design-system/tokens/layout.ts`
- Modify: `src/design-system/typography/fonts.ts`

- [ ] **Step 1: Inspect the current tokens and global CSS**

Run: `sed -n '1,220p' src/app/globals.css && sed -n '1,220p' src/design-system/tokens/semantic-tokens.ts`
Expected: Current palette and spacing values visible for replacement

- [ ] **Step 2: Update the design tokens to the approved visual system**

Implement:
- índigo/ardósia/esmeralda semantic palette
- spacing and radius for denser yet breathable layouts
- updated shadows and borders

- [ ] **Step 3: Rework global backgrounds, typography wiring, and motion defaults**

Implement:
- subtle layered background
- better body text rendering
- motion-safe transitions

- [ ] **Step 4: Run typecheck for the foundation changes**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run typecheck`
Expected: PASS

### Task 2: Rebuild the shared shells and structural components

**Files:**
- Modify: `src/design-system/components/page-header.tsx`
- Modify: `src/design-system/components/surface.tsx`
- Modify: `src/design-system/components/section-shell.tsx`
- Modify: `src/design-system/components/status-badge.tsx`
- Modify: `src/design-system/components/empty-state.tsx`
- Modify: `src/design-system/components/error-state.tsx`
- Modify: `src/design-system/components/loading-state.tsx`
- Modify: `src/design-system/components/processing-banner.tsx`
- Modify: `src/design-system/components/data-table-wrapper.tsx`
- Modify: `src/design-system/components/brand-mark.tsx`
- Modify: `src/app-shell/public/public-shell.tsx`
- Modify: `src/app-shell/authenticated/teacher-shell.tsx`
- Modify: `src/app-shell/admin/admin-shell.tsx`

- [ ] **Step 1: Update shared components to the new visual contract**

Implement:
- stronger headers
- more coherent panels
- denser but cleaner tables
- unified status treatments

- [ ] **Step 2: Rebuild the three shells around the new components**

Implement:
- clearer navigation hierarchy
- consistent spacing and page framing
- contextual top areas for each shell

- [ ] **Step 3: Run targeted tests if component expectations need adjustment**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test -- --runInBand`
Expected: PASS or focused failures only in visual component tests

### Task 3: Refresh public and teacher surfaces

**Files:**
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/app/(public)/login/page.tsx`
- Modify: `src/app/(public)/blocked/page.tsx`
- Modify: `src/features/public-experience/components/*.tsx`
- Modify: `src/app/(auth)/dashboard/page.tsx`
- Modify: `src/features/exams/dashboard/components/*.tsx`
- Modify: `src/app/(auth)/exams/new/page.tsx`
- Modify: `src/features/exams/create/components/*.tsx`
- Modify: `src/app/(auth)/exams/[id]/processing/page.tsx`
- Modify: `src/app/(auth)/exams/[id]/extraction/page.tsx`
- Modify: `src/app/(auth)/exams/[id]/result/page.tsx`
- Modify: `src/features/exams/extraction/components/*.tsx`
- Modify: `src/features/exams/results/components/*.tsx`

- [ ] **Step 1: Apply the new public presentation**

Implement:
- improved landing rhythm
- clearer CTA hierarchy
- login and blocked screens consistent with the new system

- [ ] **Step 2: Apply the new teacher workspace presentation**

Implement:
- dashboard with stronger information architecture
- creation flow with clearer grouping
- extraction/result pages with more legible review panels

- [ ] **Step 3: Run focused test suites**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test`
Expected: PASS

### Task 4: Refresh the administrative surfaces

**Files:**
- Modify: `src/app/(admin)/config/page.tsx`
- Modify: `src/app/(admin)/config/models/page.tsx`
- Modify: `src/app/(admin)/config/agents/page.tsx`
- Modify: `src/app/(admin)/config/agents/new/page.tsx`
- Modify: `src/app/(admin)/config/agents/[id]/edit/page.tsx`
- Modify: `src/app/(admin)/config/agents/[id]/evolve/page.tsx`
- Modify: `src/app/(admin)/config/supports/page.tsx`
- Modify: `src/app/(admin)/config/subjects/page.tsx`
- Modify: `src/app/(admin)/config/grade-levels/page.tsx`
- Modify: `src/app/(admin)/users/page.tsx`
- Modify: `src/features/admin/shared/*.tsx`
- Modify: `src/features/admin/agents/components/*.tsx`
- Modify: `src/features/admin/agents/evolution/components/*.tsx`
- Modify: `src/features/admin/users/components/*.tsx`

- [ ] **Step 1: Rework catalog, entity manager, and table-heavy admin views**

Implement:
- better dense layout
- clearer entity grouping
- safer action prominence

- [ ] **Step 2: Rework forms and prompt evolution comparison screens**

Implement:
- cleaner form hierarchy
- readable diff/comparison layout
- consistent admin affordances

- [ ] **Step 3: Run a11y-specific validation**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:a11y`
Expected: PASS

### Task 5: Run final validation and document outcomes

**Files:**
- Modify: `docs/plans/2026-03-21-prisma-ui-refresh-design.md` if needed for final notes

- [ ] **Step 1: Run lint**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run lint`
Expected: PASS

- [ ] **Step 2: Run typecheck**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run typecheck`
Expected: PASS

- [ ] **Step 3: Run production build**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build`
Expected: PASS

- [ ] **Step 4: Run unit and integration tests**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test`
Expected: PASS

- [ ] **Step 5: Run accessibility tests**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:a11y`
Expected: PASS

- [ ] **Step 6: Run end-to-end tests**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run test:e2e`
Expected: PASS

- [ ] **Step 7: Summarize the visual refresh outcome without touching backend behavior**

Document:
- which shared visual primitives changed
- which page groups were refreshed
- confirmation that backend behavior remained unchanged
