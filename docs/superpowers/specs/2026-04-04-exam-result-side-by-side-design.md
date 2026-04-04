# Design: Layout lado a lado — Página de resultado de exame

**Data:** 2026-04-04
**Página:** `exams/[id]/result`

## Contexto

Atualmente, a página de resultado de exame mostra o enunciado original num collapsible ("Ver enunciado original") dentro do cabeçalho de cada questão. O conteúdo adaptado é mostrado em abas (uma por apoio) abaixo do cabeçalho. O professor precisa alternar entre expandir/colapsar o original para comparar com o adaptado.

## Objetivo

Permitir que o professor veja o enunciado original e o conteúdo adaptado lado a lado, facilitando a comparação direta entre os dois.

## Abordagem

Grid CSS com dois painéis usando Tailwind (`grid-cols-2` no desktop, `grid-cols-1` no mobile).

## Estrutura visual

### Desktop (md+)

```
┌─────────────────────────────────────────────────────┐
│  [N] Questão N                      [Tipo badge]    │  ← cabeçalho full-width
│      Elementos visuais (se houver)                  │
├────────────────────────┬────────────────────────────┤
│  ENUNCIADO ORIGINAL    │  [Aba1] [Aba2] [Aba3]     │
│                        │                            │
│  Texto do enunciado    │  ✨ Conteúdo adaptado      │
│                        │  Texto adaptado...         │
│  a) alternativa A      │                            │
│  b) alternativa B      │  a) alt adaptada A ✓       │
│  c) alternativa C      │  b) alt adaptada B         │
│  d) alternativa D      │  c) alt adaptada C         │
│                        │  d) alt adaptada D         │
│                        │                            │
│                        │  [Copiar] [⭐ Feedback]    │
├────────────────────────┴────────────────────────────┤
│  ▸ Detalhes pedagógicos                             │  ← full-width
└─────────────────────────────────────────────────────┘
```

### Mobile (< md)

```
┌─────────────────────────────┐
│  [N] Questão N   [Tipo]     │
├─────────────────────────────┤
│  ENUNCIADO ORIGINAL         │
│  Texto + alternativas       │
├─────────────────────────────┤
│  [Aba1] [Aba2] [Aba3]      │
│  Conteúdo adaptado          │
│  [Copiar] [⭐ Feedback]     │
├─────────────────────────────┤
│  ▸ Detalhes pedagógicos     │
└─────────────────────────────┘
```

## Mudanças por componente

### `QuestionResult` (mudança principal)

- **Remove:** state `showOriginal`, botão collapsible "Ver enunciado original"
- **Cabeçalho:** número da questão, tipo (badge), elementos visuais — full-width acima dos painéis
- **Grid de dois painéis:** `grid-cols-1 md:grid-cols-2 gap-5`
  - **Painel esquerdo (original):** título "Enunciado Original", texto do enunciado, alternativas originais (se objetiva)
  - **Painel direito (adaptado):** abas de apoio + `AdaptationResultCard`
- **Abaixo dos painéis:** `PedagogicalDetails` da adaptação selecionada, full-width

### `AdaptationResultCard` (mudança pequena)

- **Remove:** renderização do `PedagogicalDetails` (passa a ser responsabilidade do `QuestionResult`)
- **Mantém:** conteúdo adaptado, alternativas adaptadas, copy bar, feedback form
- **Exporta:** `PedagogicalDetails` como componente separado (ou o `QuestionResult` recebe os dados diretamente)

### Sem mudanças

- `contracts.ts` — dados já existem na estrutura atual
- `ResultPageView` — só repassa dados para `QuestionResult`
- `CopyActionBar` — permanece dentro do painel adaptado
- `FeedbackForm` — permanece dentro do painel adaptado
- Hero/cabeçalho da página e bulk copy — permanecem como estão

## Estilos

| Elemento | Desktop (md+) | Mobile (< md) |
|----------|---------------|----------------|
| Grid | `grid-cols-2 gap-5` | `grid-cols-1 gap-4` |
| Proporção | 50/50 | full-width empilhado |
| Alinhamento | `items-start` | — |
| Painel original | `bg-surface-muted/40`, `ring-1 ring-border-default`, `rounded-xl p-4` | mesmo |
| Painel adaptado | `bg-brand-50/50`, `ring-1 ring-brand-200/50`, `rounded-xl p-4` (estilo existente) | mesmo |
| Detalhes pedagógicos | full-width, collapsible (estilo existente) | mesmo |

## Decisões

1. O enunciado original **não é mais collapsible** — fica sempre visível
2. Feedback permanece **por apoio** (por adaptação), dentro do painel adaptado
3. Copy bar permanece dentro do painel adaptado
4. Detalhes pedagógicos ficam abaixo dos dois painéis, mudam conforme a aba selecionada
5. Sem mudanças em tipografia, cores, animações existentes
