# Dashboard & Internal Pages Redesign — Design Spec

**Data:** 2026-03-29
**Branch:** redesign
**Escopo:** Paginas internas do professor (dashboard, new exam, extraction, processing, result)
**Abordagem:** Migracao visual + melhorias de UX focadas
**Prerequisito:** Design system ja atualizado (ver `2026-03-29-landing-page-redesign-design.md`)

---

## 1. Migracao Visual — Tokens e Cores

### 1.1 Mapeamento de cores semanticas para status

Varios componentes usam emerald/stone/amber hardcoded. Mapeamento unico usando tokens de globals.css:

| Status | Cor atual | Token correto | Uso |
|--------|-----------|---------------|-----|
| success/completed | `emerald-*` | `success` (#059669) | Bordas, badges, icones de conclusao |
| error | `red-*` hardcoded | `danger` (#DC2626) | Bordas, badges, mensagens de erro |
| warning/processing | `amber-*` hardcoded | `warning` (#D97706) | Bordas, badges, status intermediario |
| neutral/awaiting | `stone-*` hardcoded | `text-muted` / `border-strong` | Estados inativos, aguardando |

### 1.2 Arquivos e mudancas especificas

**processing-status.tsx:**
- Substituir `border-emerald-200`, `bg-emerald-50/90`, `text-emerald-900`, `text-emerald-700` por `border-green-200`, `bg-green-50`, `text-green-900`, `text-green-700`.
- Substituir `border-red-200`, `bg-red-50/90` por equivalentes usando token danger.

**adaptation-result-card.tsx:**
- Substituir `bg-emerald-100/60`, `ring-emerald-300/50`, `bg-emerald-600` por `bg-green-50`, `ring-1 ring-green-200`, `bg-green-600`.

**result-page.tsx:**
- Substituir `bg-emerald-100`, `text-emerald-700` nos icones de stat por `bg-brand-100`, `text-brand-700`.

**exam-repository-item.tsx:**
- Substituir hex codes hardcoded (`#10b981`, `#64766f`, `#0d7c66`, `#9a6100`) por CSS vars: `var(--color-success)`, `var(--color-text-secondary)`, `var(--color-warning)`, `var(--color-danger)`.
- Substituir `border-l-emerald-500` por `border-l-[var(--color-success)]`.
- Substituir `border-l-stone-400` por `border-l-[var(--color-border-strong)]`.
- Substituir `border-l-amber-500` por `border-l-[var(--color-warning)]`.
- Substituir `border-l-red-500` por `border-l-[var(--color-danger)]`.

**status-badge.tsx:**
- Substituir todos os RGBA inline e variaveis indefinidas por tokens de globals.css.
- Cada tone (default, destructive, secondary, warning) usa a cor semantica correspondente com opacidade via Tailwind.

**extraction-warning-list.tsx:**
- Substituir `text-amber-600` por `text-[var(--color-warning)]`.

**feedback-form.tsx:**
- Substituir `text-stone-300` por `text-text-muted`.

### 1.3 Abordagem para success states

Nao temos tokens `success-50`, `success-100` etc. em globals.css — so `--color-success: #059669`. Para backgrounds e bordas suaves de success, usar Tailwind `bg-green-50`, `border-green-200`, `text-green-700` como utility direta. Green e a cor semantica universal para sucesso e nao conflita com o design system (indigo = brand, terracotta = accent).

### 1.4 Inputs duplicados

**new-exam-form.tsx** e **question-review-card.tsx** definem `inputClass` manualmente replicando o estilo do componente Input. Refatorar para usar o componente `Input` diretamente onde possivel. Para selects e textareas que nao podem usar o componente Input, extrair uma constante `formControlClass` no design system com as classes base compartilhadas.

---

## 2. Dashboard — Melhorias de UX

### 2.1 Action labels claros no ExamRepositoryItem

| Status | Label atual | Label novo |
|--------|-------------|------------|
| completed | "Visualizar" | "Ver resultado" |
| error | "Ver detalhes" | "Ver erro" |
| awaiting_answers | "Continuar" | "Revisar questoes" |
| extracting/analyzing/adapting | "Acompanhar" | "Ver progresso" |

### 2.2 Datas com tooltip

Manter data relativa ("ha 2 horas") como display primario. Adicionar `title` attribute com data absoluta formatada ("29 mar 2026, 14:30") para hover nativo. Sem biblioteca extra.

### 2.3 Remover placeholder de filtros

O texto "Filters coming soon" e ruido visual. Remover completamente. Filtros terao sua propria spec quando forem implementados.

### 2.4 Inline style para Tailwind

Substituir `style={{ display: "grid", gap: "1.5rem" }}` no dashboard por `className="grid gap-6"`.

---

## 3. Processing — Feedback informativo

### 3.1 Mensagens por fase

O processing mostra apenas "Adaptando questoes" independente da fase real. Proposta de mensagens contextuais usando o campo `status` do exam:

| Status | Titulo | Mensagem de suporte |
|--------|--------|---------------------|
| uploading | "Enviando prova..." | "Fazendo upload do arquivo PDF" |
| extracting | "Extraindo questoes..." | "Lendo e interpretando o conteudo da prova" |
| analyzing | "Analisando questoes..." | "Identificando estrutura e nivel de cada questao" |
| adapting | "Adaptando questoes..." | "{completed}/{total} adaptacoes concluidas" |

Barra de progresso so aparece na fase `adapting` (unica com progresso granular). Nas demais fases, usar indicador indeterminado (animacao de pulse na barra, sem porcentagem).

### 3.2 Estado de erro com acao

Hoje o erro mostra mensagem e nada mais. Adicionar:
- Botao primario: "Criar nova prova" (link para `/exams/new`)
- Botao secundario: "Voltar ao dashboard" (link para `/dashboard`)

Se no futuro houver endpoint de retry, o botao primario pode ser atualizado para "Tentar novamente".

### 3.3 Migracao visual

- Estado completed: `border-green-200`, `bg-green-50`, `text-green-900/700`
- Estado error: `border-red-200`, `bg-red-50`, `text-red-900/700` usando token danger

---

## 4. Result Page — Hierarquia visual e discoverability

### 4.1 Bulk copy sempre visivel

Remover o collapsible do "Copiar prova completa". Os botoes de copia por apoio ficam **sempre visiveis** dentro de um card dedicado logo apos o hero header.

- Card com heading "Copiar prova completa", descricao breve, e botoes de cada apoio em `flex flex-wrap gap-2`.
- Manter o mesmo comportamento de feedback (botao muda para check, reseta apos 2.5s).

### 4.2 Cards de adaptacao — hierarquia visual

- **Alternativa correta:** `bg-green-50` + `ring-1 ring-green-200` + badge "Correta" em `bg-green-600 text-white` (substituindo emerald).
- **Alternativas incorretas:** `bg-surface-muted/50` (em vez de `bg-white/60`).
- **Tags pedagogicas (BNCC/Bloom):** Mover para dentro de um collapsible "Detalhes pedagogicos" com `text-text-secondary`. Reduz ruido visual; professores que precisam veem, os demais nao sao distraidos.

### 4.3 Stat icons no hero

Substituir `bg-emerald-100 text-emerald-700` no icone de adaptacoes por `bg-brand-100 text-brand-700`.

### 4.4 CopyActionBar — usar variantes do Button

Refatorar classes condicionais para usar a prop `variant` do Button:
- idle: `variant="outline"`
- copied: `variant="primary"`
- error: `variant="danger"`

---

## 5. Extraction Review — Progresso e orientacao

### 5.1 Indicador de progresso

Adicionar contador no topo da pagina, abaixo do info box: **"Questao X de Y respondidas"** com barra de progresso sutil (mesmo estilo da processing page, mas estatica).

Logica: contar questoes no state `answers` com valor preenchido vs total. Atualiza em tempo real conforme o professor responde.

### 5.2 Botao flutuante "Proxima questao"

Botao FAB discreto (fixed bottom-right) que faz scroll suave ate a proxima questao sem resposta. Aparece so quando a questao atual ja foi respondida.

- Estilo: `bg-brand-600 text-white`, `rounded-full`, `shadow-elevated`, icone `ArrowDown` do Lucide
- Desaparece quando todas as questoes estao respondidas
- Nao aparece se ha 2 questoes ou menos

### 5.3 Banner fixo de submit

Quando todas as questoes objetivas tiverem resposta, exibir banner fixo no bottom com botao de submit.

- Estilo: `fixed bottom-0`, `bg-white border-t shadow-elevated`
- Aparece com `animate-slide-up`
- Contem: texto "Todas as questoes revisadas" + botao "Avancar para adaptacao"

### 5.4 Migracao visual

- `text-amber-600` em ExtractionWarningList → `text-[var(--color-warning)]`
- Input hardcoded em QuestionReviewCard → componente Input ou `formControlClass`

---

## 6. New Exam Form — Validacao e clareza

### 6.1 Campos obrigatorios marcados

Adicionar asterisco vermelho (`*`) nos labels dos campos obrigatorios: Disciplina, Ano/Serie, PDF. Campo "Topico" recebe texto "(opcional)" ao lado do label em `text-text-muted`.

### 6.2 Inline validation onBlur

Adicionar validacao `onBlur` nos selects:
- Disciplina ou Ano/Serie vazio ao sair do campo → inline error imediato
- PDF: validacao ja acontece via onChange (manter)
- Topico: sem validacao onBlur (e opcional)

Validacao completa no submit continua como fallback.

### 6.3 Inline style para Tailwind

Substituir qualquer `style={{ }}` por classes Tailwind equivalentes.

---

## 7. Fora de Escopo

- Paginas de admin (config, agents, models, supports, subjects, grade levels, users)
- Login page
- Paginacao na extraction review (spec futura)
- Wizard multi-step no new exam (spec futura)
- Polling/SSE no processing (spec futura)
- Sidebar de navegacao entre questoes no result (spec futura)
- Novos endpoints de API (retry, etc.)
- Mudancas no design system base (componentes Button, Card, Input ja estao corretos)
