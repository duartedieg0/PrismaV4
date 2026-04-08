# Feedback Nudge ao Copiar Adaptação

**Data:** 2026-04-08
**Status:** Aprovado

## Problema

Quando o usuário clica em "Copiar adaptação" na página de resultado, ele sai sem deixar feedback. A melhoria deve exibir um nudge amigável solicitando avaliação da adaptação copiada, apenas quando o feedback ainda não foi enviado.

## Objetivo

Aumentar a taxa de envio de feedback nas adaptações, com uma mensagem contextual e não intrusiva exibida no momento de maior intenção de uso: ao copiar.

## Comportamento

- Ao clicar em "Copiar adaptação", se o feedback da adaptação **não foi enviado**, exibir um popover acima do botão com mensagem incentivando a avaliação.
- Se o feedback **já foi enviado** (dado do servidor ou enviado na sessão atual), o nudge nunca é exibido.
- O nudge reaparece a cada clique em copiar enquanto o feedback não for enviado.
- O nudge é fechado manualmente (botão ✕) ou automaticamente ao enviar o feedback.
- Um botão CTA "Avaliar" faz scroll suave até o formulário de feedback no mesmo card.

## Arquitetura

### Componentes afetados

| Componente | Mudança |
|---|---|
| `adaptation-result-card.tsx` | Gerencia `showNudge` e `feedbackSubmitted`; passa callbacks |
| `copy-action-bar.tsx` | Recebe `showFeedbackNudge` e `onNudgeClose`; renderiza o popover |
| `feedback-form.tsx` | Recebe callback `onFeedbackSubmit` opcional |

### Novos estados em `adaptation-result-card.tsx`

```ts
const [feedbackSubmitted, setFeedbackSubmitted] = useState(
  adaptation.feedback !== null
)
const [showNudge, setShowNudge] = useState(false)
```

### Fluxo de dados

```
Usuário clica "Copiar adaptação"
  → CopyActionBar dispara onCopy callback
  → AdaptationResultCard verifica feedbackSubmitted
    → false: setShowNudge(true)
    → true: nenhuma ação

Usuário clica ✕ no popover
  → onNudgeClose callback
  → AdaptationResultCard: setShowNudge(false)

Usuário envia feedback
  → FeedbackForm dispara onFeedbackSubmit callback
  → AdaptationResultCard: setFeedbackSubmitted(true), setShowNudge(false)

Usuário clica "Avaliar" no popover
  → Scroll suave até FeedbackForm (via ref)
```

## Interface

### Novas props do `CopyActionBar`

```ts
showFeedbackNudge?: boolean
onNudgeClose?: () => void
feedbackRef?: React.RefObject<HTMLElement>
```

### Nova prop do `FeedbackForm`

```ts
onFeedbackSubmit?: () => void
```

### Anatomia do popover

```
┌─────────────────────────────────────────────┐
│  Gostou desta adaptação? Seu feedback        │
│  ajuda a melhorar as próximas.              │
│                              [Avaliar →]  ✕ │
└─────────────────────────────────────────────┘
              [Copiar adaptação]
```

- **Posicionamento:** `position: absolute`, acima do botão (bottom: 100% + margin)
- **Estilo:** consistente com o design system (indigo/terracotta), sombra sutil, bordas arredondadas
- **Acessibilidade:** `role="tooltip"` ou `role="status"` com `aria-live="polite"`

## Casos de borda

| Situação | Comportamento |
|---|---|
| `adaptation.feedback !== null` ao carregar | `feedbackSubmitted = true`, nudge nunca aparece |
| Usuário envia feedback com nudge aberto | `showNudge = false` via `onFeedbackSubmit` |
| Usuário fecha nudge e copia de novo | Nudge reaparece |
| Clique em copiar com nudge já aberto | Nenhuma ação adicional (nudge já visível) |
| `onFeedbackSubmit` não fornecido ao `FeedbackForm` | Sem quebra — prop é opcional |

## Testes

- [ ] Renderiza nudge após clicar em copiar quando `adaptation.feedback === null`
- [ ] Não renderiza nudge quando `adaptation.feedback !== null`
- [ ] Fechar via ✕ remove o popover
- [ ] Copiar novamente após fechar o nudge exibe o nudge novamente
- [ ] Enviar feedback esconde o nudge
- [ ] Não exibe nudge após envio de feedback na mesma sessão
- [ ] Botão "Avaliar" faz scroll até o formulário de feedback

## Arquivos relevantes

- `src/features/exams/results/components/adaptation-result-card.tsx`
- `src/features/exams/results/components/copy-action-bar.tsx`
- `src/features/exams/results/components/feedback-form.tsx`
- `src/features/exams/results/contracts.ts` — `AdaptationResultView.feedback`
