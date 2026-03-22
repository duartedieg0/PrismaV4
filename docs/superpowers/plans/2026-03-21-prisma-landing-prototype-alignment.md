# Prisma Landing Prototype Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestruturar a landing pública do `PrismaV2` para uma aproximação forte do protótipo, sem alterar backend nem fluxos do produto.

**Architecture:** A mudança fica isolada na camada visual pública. O shell público e os componentes da landing serão recalibrados para um esqueleto mais horizontal, com hero forte, métricas imediatamente abaixo e cards menos arredondados, preservando a semântica e os links já existentes.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS variables inline styles, Vitest, Playwright

---

### Task 1: Recalibrar o shell público

**Files:**
- Modify: `src/app-shell/public/public-shell.tsx`
- Test: `e2e/smoke-shells.spec.ts`

- [ ] Reduzir o peso visual do topo público e alinhar a topbar à referência
- [ ] Preservar links, breadcrumbs e banner opcional sem mudar comportamento
- [ ] Verificar visualmente que a landing não fica encapsulada em excesso

### Task 2: Refazer hero e faixa de métricas

**Files:**
- Modify: `src/features/public-experience/components/public-hero.tsx`
- Modify: `src/features/public-experience/components/trust-strip.tsx`
- Modify: `src/app/(public)/page.tsx`
- Test: `e2e/smoke-shells.spec.ts`

- [ ] Transformar o hero em um bloco horizontal mais próximo da referência
- [ ] Reduzir radius, vidro e profundidade decorativa
- [ ] Posicionar a faixa de métricas imediatamente abaixo do hero
- [ ] Garantir responsividade em mobile sem overflow

### Task 3: Endurecer capacidades, fluxo, FAQ, CTA e footer

**Files:**
- Modify: `src/features/public-experience/components/benefits-section.tsx`
- Modify: `src/features/public-experience/components/flow-section.tsx`
- Modify: `src/features/public-experience/components/public-faq.tsx`
- Modify: `src/features/public-experience/components/final-cta.tsx`
- Modify: `src/features/public-experience/components/public-footer.tsx`

- [ ] Reduzir arredondamento e ornamentação
- [ ] Uniformizar grids e espaçamentos para se aproximar do protótipo
- [ ] Manter acessibilidade e contraste

### Task 4: Ajustes finos e validação

**Files:**
- Modify: `src/app/globals.css` (se necessário)
- Modify: `src/design-system/tokens/semantic-tokens.ts` (somente se necessário)
- Test: `npm run lint`
- Test: `npm run typecheck`
- Test: `npm run build`
- Test: `npm run test`
- Test: `npm run test:a11y`
- Test: `npm run test:e2e`

- [ ] Aplicar ajustes globais mínimos apenas se a landing ainda estiver desalinhada
- [ ] Rodar o gate completo
- [ ] Confirmar que não houve alteração de backend nem regressão funcional
