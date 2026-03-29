# Landing Page Redesign -- Design Spec

**Data:** 2026-03-29
**Branch:** redesign
**Abordagem:** Institucional Limpo
**Objetivo:** Redesenhar a landing page e o design system do PrismaV4, migrando de uma estetica "tech/terminal" para uma identidade visual profissional, moderna e acolhedora para professores e educadores.

---

## 1. Pilares de Design

1. **Institucional** -- Seriedade, confianca, autoridade academica
2. **Moderno** -- Facilidade de uso, interface limpa e atual
3. **Humano** -- Feito pensando no dia-a-dia do professor

---

## 2. Design Tokens

### 2.1 Paleta de Cores

#### Brand (Indigo)

| Token | Valor | Uso |
|-------|-------|-----|
| brand-50 | #EEF2FF | Backgrounds sutis, hover states |
| brand-100 | #E0E7FF | Backgrounds de cards secundarios |
| brand-200 | #C7D2FE | Bordas ativas, focus rings |
| brand-300 | #A5B4FC | Icones secundarios |
| brand-400 | #818CF8 | Hover de elementos primarios |
| brand-500 | #6366F1 | Elementos interativos secundarios |
| brand-600 | #4F46E5 | **Cor principal** -- CTAs, headings, navbar |
| brand-700 | #4338CA | Hover de CTAs primarios |
| brand-800 | #3730A3 | Texto de destaque, links visitados |
| brand-900 | #312E81 | Backgrounds escuros (footer, banners) |
| brand-950 | #1E1B4B | Background mais escuro |

#### Accent (Terracota)

| Token | Valor | Uso |
|-------|-------|-----|
| accent-50 | #FDF4EE | Background sutil de destaque |
| accent-100 | #FCE6D4 | Badges de destaque |
| accent-200 | #F8C9A3 | Bordas decorativas |
| accent-300 | #F3A76D | Icones de acento |
| accent-400 | #E8893D | Hover de CTAs accent |
| accent-500 | #C2703E | **Acento principal** -- CTA do FinalCTA, badges, destaques |
| accent-600 | #A65A30 | Hover de accent |
| accent-700 | #8A4626 | Texto accent forte |

#### Superficies

| Token | Valor | Uso |
|-------|-------|-----|
| canvas | #FAFAFA | Background da pagina |
| surface | #FFFFFF | Cards, containers |
| surface-muted | #F5F5F5 | Secoes alternadas |
| surface-raised | #FEFEFE | Cards com elevacao |
| surface-overlay | rgba(255,255,255,0.92) | Modais, dropdowns |
| surface-dark | #312E81 | Secoes escuras (FinalCTA) |
| surface-dark-soft | #3730A3 | Cards dentro de secoes escuras |

#### Texto

| Token | Valor | Uso |
|-------|-------|-----|
| text-primary | #111827 | Titulos, corpo principal |
| text-secondary | #4B5563 | Texto de suporte, descricoes |
| text-muted | #9CA3AF | Placeholders, labels secundarios |
| text-inverse | #F9FAFB | Texto sobre fundos escuros |
| text-brand | #4F46E5 | Links, texto de destaque |

#### Bordas

| Token | Valor | Uso |
|-------|-------|-----|
| border-default | #E5E7EB | Bordas padrao |
| border-muted | #F3F4F6 | Bordas sutis |
| border-strong | #D1D5DB | Bordas de enfase |
| border-brand | rgba(79,70,229,0.2) | Focus rings, bordas ativas |

#### Estado

| Token | Valor | Uso |
|-------|-------|-----|
| success | #059669 | Mantido |
| warning | #D97706 | Mantido |
| danger | #DC2626 | Mantido |
| info | #4F46E5 | Alinhado com brand |

### 2.2 Tipografia

| Token | Valor |
|-------|-------|
| font-display | Satoshi, system-ui, sans-serif |
| font-body | Satoshi, system-ui, sans-serif |
| font-mono | IBM Plex Mono (mantido para code blocks internos) |

- Escala de tamanhos mantida (xs a 6xl)
- Titulos: weight 700-800
- Corpo: weight 400-500

### 2.3 Sombras

| Token | Valor |
|-------|-------|
| shadow-xs | 0 1px 2px rgba(0,0,0,0.04) |
| shadow-soft | 0 2px 8px rgba(0,0,0,0.05) |
| shadow-card | 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04) |
| shadow-elevated | 0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04) |
| shadow-modal | 0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05) |

### 2.4 Border Radius

| Token | Valor |
|-------|-------|
| radius-sm | 0.375rem (6px) |
| radius-md | 0.5rem (8px) |
| radius-lg | 0.75rem (12px) |
| radius-xl | 1rem (16px) |
| radius-2xl | 1.25rem (20px) -- card padrao |
| radius-pill | 9999px |

### 2.5 Animacoes

- **Manter:** fade-in (0.5s ease-out), slide-up (0.5s ease-out, 12px), scale-in (0.2s ease-out)
- **Remover:** terminal-blink, pulse-glow, text-glow

---

## 3. Secoes da Landing Page

### 3.1 Navbar

- Fundo branco (#FFFFFF) com border-bottom 1px solid #E5E7EB
- Logo atualizado com cores indigo
- Links: Satoshi 500, cor text-secondary, hover text-brand
- Botao Login: variante ghost (texto indigo-600, hover bg indigo-50)
- Botao CTA: variante primary (bg indigo-600, texto branco), radius pill
- Sticky com shadow-xs ao scrollar
- Mobile: hamburger menu indigo-600, menu full-width branco

### 3.2 Hero

- Fundo canvas (#FAFAFA), sem fundo escuro
- Layout duas colunas desktop (texto esquerda, mockup direita). Mobile empilhado.
- Headline: Satoshi 800, 5xl desktop / 3xl mobile, text-primary
- Subtitulo: Satoshi 400, lg, text-secondary, max-width 540px
- CTA primario: indigo-600, branco, lg, pill, padding 16px 32px
- CTA secundario: outline (borda indigo-200, texto indigo-600, hover bg indigo-50)
- Mockup: screenshot real da tela de resultado de adaptacao em BrowserFrame estilizado. Frame com borda border-default, radius-2xl, shadow-elevated, barra simplificada (3 dots + URL). Leve rotacao 3D (2-3 graus) via CSS perspective.
- Padding vertical 80px desktop / 48px mobile. Gap 64px entre colunas.

### 3.3 TrustStrip

- Fundo surface-muted (#F5F5F5)
- 3 stats em linha, sem cards com borda -- fundo da faixa unifica
- Numeros: Satoshi 700, 4xl, text-brand (#4F46E5)
- Labels: Satoshi 400, sm, text-secondary
- Sem icones -- numeros falam por si
- Separadores: linha vertical 1px border-default entre stats no desktop. Sem separadores no mobile.
- Padding vertical 40px

### 3.4 FlowSection ("Como funciona")

- Fundo surface (#FFFFFF)
- Heading: "Como funciona", Satoshi 700, 3xl, text-primary, centralizado
- 3 cards em linha desktop, empilhados mobile
- Linha tracejada (dashed) border-default conectando os 3 cards no desktop (horizontal). No mobile, vertical.
- Numeracao: circulo 40px, fundo brand-600, texto branco Satoshi 700, sobre a linha tracejada
- Cards: fundo surface, borda border-default 1px, radius-xl, shadow-xs, padding 24px. Sem hover.
- Icone: Lucide 24px em brand-500, abaixo da numeracao
- Titulo: Satoshi 600, lg, text-primary
- Descricao: Satoshi 400, sm, text-secondary
- Padding vertical 80px, gap 32px entre cards

### 3.5 BenefitsSection

- Fundo surface-muted (#F5F5F5)
- Heading: "Por que escolher o Prisma", Satoshi 700, 3xl, text-primary, centralizado
- Grid 2x2 desktop, coluna unica mobile, gap 24px
- Cards: fundo surface, borda border-default 1px, radius-xl, shadow-soft, padding 32px. Hover: shadow-card em 200ms.
- Icone: Lucide 28px em container 48px (fundo brand-50, radius-lg), icone brand-600
- Titulo: Satoshi 600, base, text-primary
- Descricao: Satoshi 400, sm, text-secondary
- Primeiro card (economia de tempo): borda esquerda 3px accent-500 (#C2703E) -- unico uso de terracota na pagina
- Padding vertical 80px

### 3.6 Testimonials

- Fundo surface (#FFFFFF)
- Heading: "O que dizem os professores", Satoshi 700, 3xl, text-primary, centralizado
- 3 cards em linha desktop. Mobile: carrossel horizontal com scroll snap (nativo, sem biblioteca).
- Cards: fundo surface, borda border-default 1px, radius-xl, shadow-xs, padding 28px
- Aspas decorativas: caractere `"`, Satoshi 800, 4xl, cor brand-100 (#E0E7FF), topo esquerdo
- Texto: Satoshi 400 italic, sm, text-secondary, line-height 1.7
- Separador: 1px border-muted, margin vertical 16px
- Avatar: circulo 40px, iniciais (fundo brand-50, texto brand-600, Satoshi 600)
- Nome: Satoshi 600, sm, text-primary
- Cargo/escola: Satoshi 400, xs, text-muted
- Padding vertical 80px, gap 24px

### 3.7 FinalCTA

- Fundo surface-dark (#312E81) -- unica secao escura
- Layout centralizado, max-width 640px
- Headline: Satoshi 800, 4xl desktop / 2xl mobile, text-inverse
- Subtitulo: Satoshi 400, lg, brand-200
- CTA primario: accent-500 (#C2703E), branco, lg, pill. Hover accent-400. **Unico botao terracota da pagina.**
- CTA secundario: ghost (texto brand-200, borda brand-200 opacity 0.3, hover bg rgba branco 0.08)
- Sem animacao de logo
- Gradiente radial sutil em brand-800 no centro do fundo
- Padding vertical 96px desktop / 64px mobile

### 3.8 Footer

- Fundo brand-950 (#1E1B4B) -- mais escuro que FinalCTA, transicao natural
- 4 colunas desktop (Logo/tagline + Produto + Suporte + Legal). Mobile: logo full-width, links em 2 cols.
- Logo: variante monocromatica branca, sm
- Tagline: Satoshi 400, sm, brand-300
- Titulos colunas: Satoshi 600, xs, brand-200, uppercase, letter-spacing 0.05em
- Links: Satoshi 400, sm, brand-300, hover text-inverse, transicao 150ms
- Copyright: Satoshi 400, xs, brand-400 opacity 0.6. Separado por 1px brand-800, padding top 24px.
- Padding vertical 48px

---

## 4. Componentes do Design System

### 4.1 Componentes a Atualizar

| Componente | Mudancas |
|------------|----------|
| **Button** | Variantes primary (indigo-600), secondary (indigo-50/indigo-600), outline (borda indigo-200), ghost (hover indigo-50), danger (mantido). Nova variante `accent` (terracota-500). |
| **Card** | Remover variantes `terminal` e `glass`. Manter default, muted, outlined. Atualizar cores. |
| **Badge** | Remover variante `terminal`. Atualizar cores. Nova variante `accent` (fundo accent-50, texto accent-700). |
| **Logo** | Atualizar cores para indigo. Nova variante `mono` (branca para fundos escuros). |
| **Input/Textarea** | Focus ring atualizado para border-brand (indigo). |
| **StatCard** | Atualizar cores para brand. |
| **SectionShell** | Atualizar backgrounds disponiveis. |

### 4.2 Componentes a Remover

- **TerminalBlock** -- Sem uso na nova identidade
- **TerminalLine** -- Sem uso na nova identidade

Se usados em paginas internas, migrar para componente de code block simples.

### 4.3 Componentes Novos

- **BrowserFrame** -- Container estilizado que simula janela de navegador. 3 dots decorativos + barra de URL em cinza claro. Radius radius-2xl, sombra shadow-elevated. Recebe children. Reutilizavel em qualquer pagina que precise mostrar o produto.

### 4.4 Tokens e Fontes

- **globals.css:** Substituir paleta emerald/amber por indigo/terracota. Remover tokens de terminal (surface-terminal, text-terminal, terminal-blink, pulse-glow, text-glow).
- **tokens.ts:** Sincronizar com globals.css.
- **layout.tsx:** Substituir Literata + Source Sans 3 por Satoshi. Manter IBM Plex Mono.

---

## 5. Decisoes de Design

| Decisao | Escolha | Razao |
|---------|---------|-------|
| Cor principal | Indigo (#4F46E5) | Sabedoria, confianca, autoridade academica |
| Cor de acento | Terracota (#C2703E) | Organico, humano, diferenciador |
| Tipografia | Satoshi (unica familia) | Moderna, design-forward, personalidade marcante |
| Estrutura | Manter 7 secoes atuais | Pragmatico, foco no visual |
| Hero visual | Screenshot real + BrowserFrame | Mostra o produto real, gera confianca |
| Estetica terminal | Removida completamente | Nao ressoa com publico educador |
| Uso de terracota | Restrito (borda do 1o benefit card + CTA do FinalCTA) | Impacto maximo por escassez |
| Backgrounds | Branco + #F5F5F5 alternados | Ritmo visual limpo, institucional |

---

## 6. Fora de Escopo

- Redesign de paginas internas (dashboard, formularios, admin)
- Novos copies/textos -- mantemos os atuais
- Integracao de analytics ou tracking
- SEO tecnico (meta tags, structured data)
- Acessibilidade alem do que ja existe (foco em visual neste momento)
