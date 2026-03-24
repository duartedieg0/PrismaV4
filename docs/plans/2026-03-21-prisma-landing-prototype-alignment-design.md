# Prisma Landing Prototype Alignment Design

## Goal

Recalibrar a landing page pública do `PrismaV2` para uma aproximação forte do protótipo de referência, reduzindo a sensação arredondada e deixando a composição mais horizontal, editorial e direta, sem alterar backend ou fluxos.

## Problem

A landing atual já compartilha parte da paleta e do tom do protótipo, mas ainda se afasta dele em três pontos:

1. A composição está “fofa” e encapsulada demais, com blocos muito arredondados e ritmo mais suave do que a referência.
2. O hero ainda parece um card decorativo, não um bloco principal horizontal com valor comercial claro.
3. A sequência hero → métricas → capacidades → CTA final não replica o ritmo visual do protótipo, então a semelhança percebida continua baixa.

## Chosen Approach

Seguir com um alinhamento estrutural forte, sem cair em cópia literal do HTML de referência. A landing vai absorver o padrão do protótipo em:

- topbar compacta e seca;
- hero horizontal com mock de produto inclinado;
- faixa de métricas imediatamente abaixo do hero;
- grid de capacidades mais reto e uniforme;
- CTA final mais limpo, mais claro e com menos ornamentação;
- redução geral de cantos exageradamente arredondados.

Essa abordagem preserva a identidade do produto, mas corrige a divergência visual que ainda incomoda.

## Scope

### In scope

- `src/app-shell/public/public-shell.tsx`
- `src/app/(public)/page.tsx`
- `src/features/public-experience/components/public-hero.tsx`
- `src/features/public-experience/components/trust-strip.tsx`
- `src/features/public-experience/components/benefits-section.tsx`
- `src/features/public-experience/components/flow-section.tsx`
- `src/features/public-experience/components/public-faq.tsx`
- `src/features/public-experience/components/final-cta.tsx`
- `src/features/public-experience/components/public-footer.tsx`
- pequenos ajustes de tokens/globals se forem necessários para a landing

### Out of scope

- backend, rotas, contratos, APIs e banco
- fluxos autenticados do professor/admin
- mudança de copy estrutural além do necessário para encaixe visual

## Visual Direction

### Layout

- hero com bloco verde principal e duas colunas bem definidas
- topbar mais horizontal, leve e compacta
- métricas como cards baixos logo abaixo do hero
- seções seguintes com mais espaço branco e menos encapsulamento
- cards com radius menor e sombras mais curtas

### Shape language

- reduzir `pill` excessivo
- usar cards e botões com cantos menores, mais próximos da referência
- reservar curvas maiores só para blocos principais

### Typography

- títulos mais curtos, mais pesados e mais compactos
- descrições menores e com largura controlada
- hierarquia mais forte entre headline, subtítulo e supporting copy

### Color

- manter verde profundo como identidade principal
- reforçar fundos quentes/claros
- usar verde menta de destaque apenas em blocos estratégicos como a faixa de métricas

## Page Structure

1. Topbar compacta
2. Hero horizontal com CTAs e mock de produto
3. Faixa de métricas
4. Grid de capacidades
5. Fluxo resumido
6. FAQ leve
7. CTA final limpo
8. Footer institucional mais seco

## Risks

- exagerar na aproximação e deixar a landing visualmente desconectada das áreas autenticadas
- reduzir demais o radius e perder conforto visual/acessibilidade
- quebrar testes E2E/a11y por mudanças em estrutura semântica

## Mitigations

- preservar cores, branding e nomenclatura do produto
- manter semântica e links existentes
- validar com `lint`, `typecheck`, `build`, `test`, `test:a11y` e `test:e2e`
