# Prisma Phase 3 Public Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** reconstruir a landing pública para comunicar valor pedagógico com clareza, conduzir ao login e respeitar o redirect de usuário autenticado.

**Architecture:** manter a rota `/` como Server Component, delegando o redirect do usuário autenticado à camada de auth já consolidada e compondo a experiência pública por seções visuais reutilizáveis fora de `components/ui/`. A página deve usar o design system já criado, sem depender de dados privados e sem reintroduzir checagens ad hoc de auth.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Supabase SSR, Vitest, Playwright, design-system local

---

### Task 1: Definir conteúdo e estrutura da landing pública

**Files:**
- Create: `src/features/public-experience/content.ts`
- Create: `src/test/features/public-experience/content.test.ts`

- [ ] **Step 1: Write the failing content contract test**

Cover:
- hero com proposta de valor em PT-BR;
- sinais de confiança;
- fluxo em 3 passos;
- benefícios concretos;
- FAQ enxuto;
- CTA primário;
- footer institucional.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/test/features/public-experience/content.test.ts`
Expected: FAIL because the public-experience content module does not exist yet.

- [ ] **Step 3: Implement the minimal content module**

Export structured content objects for:
- hero;
- trust signals;
- flow steps;
- benefits;
- FAQ;
- primary/final CTA;
- footer copy.

Keep copy aligned with `spec/spec-04-landing-and-public-experience.md` and avoid placeholder text.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/test/features/public-experience/content.test.ts`
Expected: PASS.

### Task 2: Montar seções reutilizáveis da experiência pública

**Files:**
- Create: `src/features/public-experience/components/public-hero.tsx`
- Create: `src/features/public-experience/components/trust-strip.tsx`
- Create: `src/features/public-experience/components/flow-section.tsx`
- Create: `src/features/public-experience/components/benefits-section.tsx`
- Create: `src/features/public-experience/components/public-faq.tsx`
- Create: `src/features/public-experience/components/final-cta.tsx`
- Create: `src/features/public-experience/components/public-footer.tsx`
- Create: `src/test/features/public-experience/public-landing.test.tsx`
- Create: `src/test/features/public-experience/public-landing.a11y.test.tsx`

- [ ] **Step 1: Write the failing component and page composition tests**

Cover:
- CTA de login visível no hero;
- fluxo renderizado em três etapas;
- benefícios legíveis;
- FAQ acessível;
- footer institucional;
- heading hierarchy correta e links acionáveis.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:
- `npm run test -- src/test/features/public-experience/public-landing.test.tsx`
- `npm run test:a11y -- src/test/features/public-experience/public-landing.a11y.test.tsx`
Expected: FAIL because the section components do not exist yet.

- [ ] **Step 3: Implement the minimal public section components**

Use the existing design system primitives and keep responsibilities split:
- `public-hero` for title, subtitle, CTA, supporting signals;
- `trust-strip` for institutional confidence markers;
- `flow-section` for the 3-step process;
- `benefits-section` for concrete value points;
- `public-faq` for concise Q&A;
- `final-cta` for bottom conversion block;
- `public-footer` for institutional closeout.

Do not edit generated shadcn files.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:
- `npm run test -- src/test/features/public-experience/public-landing.test.tsx`
- `npm run test:a11y -- src/test/features/public-experience/public-landing.a11y.test.tsx`
Expected: PASS.

### Task 3: Integrar a landing à rota pública com redirect consistente

**Files:**
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/features/access-control/access-policy.ts`
- Modify: `src/test/features/auth/access-policy.test.ts`
- Create: `src/test/features/public-experience/public-home-page.test.tsx`
- Create: `e2e/helpers/auth-session.ts`
- Modify: `.env.example`
- Modify: `e2e/auth-access.spec.ts`
- Modify: `e2e/smoke-shells.spec.ts`

- [ ] **Step 1: Write the failing route state tests**

Cover:
- `/` continua classificada como rota pública;
- usuário autenticado em rota pública é redirecionado para `/dashboard`;
- `next`/query params não alteram o comportamento da landing.
- a landing renderiza normalmente para anônimo em um teste de página dedicado.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:
- `npm run test -- src/test/features/auth/access-policy.test.ts`
- `npm run test -- src/test/features/public-experience/public-home-page.test.tsx`
Expected: FAIL because the public-route redirect coverage and the rebuilt landing page composition do not exist yet.

- [ ] **Step 3: Implement the page integration against the existing access layer**

Do not create a second source of truth for public-route redirects.
Keep `/` governed by the existing access-control layer in `src/features/access-control/access-policy.ts` and `src/proxy.ts`.
Replace the current placeholder landing with the composed public-experience sections, using the public-shell semantics only where they fit the landing and preserving footer/header intent explicitly in the page composition.

- [ ] **Step 4: Extend E2E coverage for the new public experience**

Update Playwright coverage for:
- CTA principal aponta para `/login`;
- landing renderiza hero e seções principais;
- usuário anônimo continua redirecionado corretamente de `/dashboard` e `/config` pela camada central de acesso.
- usuário autenticado ao visitar `/` é enviado para `/dashboard`.

Implement a small `e2e/helpers/auth-session.ts` helper that creates an authenticated browser state from Supabase test credentials stored in env, instead of hardcoding cookies or bypassing the real auth flow.
Use explicit env names:
- `E2E_SUPABASE_TEST_EMAIL`
- `E2E_SUPABASE_TEST_PASSWORD`

Document both vars in `.env.example` and skip only the authenticated landing assertion when they are absent.

- [ ] **Step 5: Run the route and E2E tests to verify they pass**

Run:
- `npm run test -- src/test/features/auth/access-policy.test.ts`
- `npm run test -- src/test/features/public-experience/public-home-page.test.tsx`
- `npm run test:e2e -- e2e/auth-access.spec.ts e2e/smoke-shells.spec.ts`
Expected: PASS.

### Task 4: Fechar copy, acessibilidade e quality gate da Fase 3

**Files:**
- Modify: `src/features/public-experience/content.ts`
- Modify: `src/features/public-experience/components/*.tsx` as needed
- Modify: `src/test/smoke/app-shell-smoke.test.tsx`

- [ ] **Step 1: Review PT-BR copy against the spec**

Verify:
- clareza da proposta de valor;
- benefício pedagógico explícito;
- revisão humana do professor;
- suporte a múltiplas necessidades educacionais;
- tom institucional e direto.

- [ ] **Step 2: Verify no visual or semantic regressions remain**

Check:
- CTA de login continua visível sem scroll excessivo;
- a hierarquia de headings permanece válida;
- seções não ficam densas demais em mobile;
- nenhuma seção usa texto placeholder.
- o smoke test da home reflete o novo H1/estrutura pública.

- [ ] **Step 3: Run the full quality gate for Phase 3**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:a11y`
- `npm run test:e2e`

Expected: all PASS.
