# Feedback Nudge ao Copiar Adaptação

**Data:** 2026-04-08
**Status:** Aprovado

## Problema

Quando o usuário clica em "Copiar adaptação" na página de resultado, ele sai sem deixar feedback. A melhoria deve exibir um nudge amigável solicitando avaliação da adaptação copiada, apenas quando o feedback ainda não foi enviado.

## Objetivo

Aumentar a taxa de envio de feedback nas adaptações, com uma mensagem contextual e não intrusiva exibida no momento de maior intenção de uso: ao copiar.

## Comportamento

- Ao clicar em "Copiar adaptação" **com sucesso**, se o feedback da adaptação **não foi enviado**, exibir um popover acima do botão com mensagem incentivando a avaliação.
- Se a cópia **falhar** (catch), o nudge não deve aparecer — o usuário já recebe o feedback de erro.
- Se o feedback **já foi enviado** (dado do servidor ou enviado na sessão atual), o nudge nunca é exibido — incluindo se o usuário copiar novamente após enviar.
- O nudge reaparece a cada cópia bem-sucedida enquanto o feedback não for enviado.
- O nudge é fechado manualmente (botão ✕ ou tecla Escape) ou automaticamente ao enviar o feedback.
- Um botão CTA "Avaliar" faz scroll suave até o formulário de feedback no mesmo card.

## Arquitetura

### Componentes afetados

| Componente | Mudança |
|---|---|
| `adaptation-result-card.tsx` | Adiciona estados `showNudge` e `feedbackSubmitted`; declara `feedbackRef`; coordena callbacks |
| `copy-action-bar.tsx` | Adiciona props `onCopySuccess`, `showFeedbackNudge`, `onNudgeClose`, `onScrollToFeedback`; renderiza o popover |
| `feedback-form.tsx` | Adiciona prop `onFeedbackSubmit` opcional; adiciona `forwardRef` para expor o elemento `<form>` |

### Novos estados em `adaptation-result-card.tsx`

```ts
// adaptation.feedback é FeedbackView | null (nunca undefined)
const [feedbackSubmitted, setFeedbackSubmitted] = useState(
  adaptation.feedback !== null
)
const [showNudge, setShowNudge] = useState(false)
const feedbackRef = useRef<HTMLFormElement>(null)
```

### Prop `onCopy` vs `onCopySuccess`

O `onCopy` existente em `CopyActionBar` **substitui** a chamada `navigator.clipboard.writeText()` — não é um hook de notificação. Por isso, uma nova prop independente `onCopySuccess?: () => void` é adicionada. Ela é chamada **imediatamente após `setStatus("copied")`** e antes do `setTimeout`, sem alterar o comportamento do `onCopy` existente. Em caso de erro (catch), `onCopySuccess` não é chamado.

Ordem de execução no bloco `try` após a cópia:
1. Dispara `void fetch(...)` de analytics (fire-and-forget)
2. `setStatus("copied")`
3. `onCopySuccess?.()` ← nova chamada aqui
4. `setTimeout(() => setStatus("idle"), 2500)`

### Fluxo de dados

```
Usuário clica "Copiar adaptação"
  → CopyActionBar executa cópia (via onCopy ou clipboard padrão)
    → Sucesso: chama onCopySuccess()
      → AdaptationResultCard verifica feedbackSubmitted e showNudge:
        → feedbackSubmitted = true: nenhuma ação
        → feedbackSubmitted = false e showNudge = false: setShowNudge(true)
        → feedbackSubmitted = false e showNudge = true: nenhuma ação (já visível, evita re-render)
    → Erro: setStatus("error"), onCopySuccess não é chamado, nudge não aparece

Usuário pressiona Escape ou clica ✕ no popover
  → onNudgeClose callback → AdaptationResultCard: setShowNudge(false)

Usuário clica "Avaliar" no popover
  → onScrollToFeedback callback
  → AdaptationResultCard: feedbackRef.current?.scrollIntoView({ behavior: "smooth" })
    (guard: nenhuma ação se feedbackRef.current === null)

Usuário envia feedback (FeedbackForm — apenas quando response.ok)
  → onFeedbackSubmit callback
  → AdaptationResultCard: setFeedbackSubmitted(true), setShowNudge(false)
```

### Scroll para o formulário

O scroll é responsabilidade do `AdaptationResultCard`:
- `feedbackRef` é declarado no card via `useRef<HTMLFormElement>(null)`
- `FeedbackForm` recebe o ref via `React.forwardRef<HTMLFormElement, FeedbackFormProps>` e aplica no `<form>`
- O caller existente `<FeedbackForm ... />` passa a receber também `ref={feedbackRef}`
- `CopyActionBar` recebe `onScrollToFeedback?: () => void` e chama essa função — não manipula refs diretamente

A migração para `forwardRef` é retrocompatível: callers que não passam `ref` continuam funcionando sem mudança.

## Interface

### Novas props do `CopyActionBar`

```ts
onCopySuccess?: () => void        // chamado imediatamente após setStatus("copied")
showFeedbackNudge?: boolean       // controla visibilidade do popover
onNudgeClose?: () => void         // chamado ao fechar o popover (✕ ou Escape)
onScrollToFeedback?: () => void   // chamado ao clicar em "Avaliar"
```

### Nova prop do `FeedbackForm`

```ts
onFeedbackSubmit?: () => void  // chamado após response.ok no handleSubmit
```

`FeedbackForm` passa a usar `React.forwardRef<HTMLFormElement, FeedbackFormProps>`.

### Anatomia do popover

```
┌─────────────────────────────────────────────┐
│  Gostou desta adaptação? Seu feedback        │
│  ajuda a melhorar as próximas.              │
│                              [Avaliar →]  ✕ │
└─────────────────────────────────────────────┘
              [Copiar adaptação]
```

- **Texto:** "Gostou desta adaptação? Seu feedback ajuda a melhorar as próximas."
- **Botão CTA "Avaliar →":** chama `onScrollToFeedback`
- **Botão fechar (✕):** chama `onNudgeClose`
- **Posicionamento:** `position: absolute`, `bottom: 100%` + margem, dentro do `<div>` raiz de `CopyActionBar` que recebe `position: relative`

### Acessibilidade

`CopyActionBar` já possui um `<span aria-live="polite">` para anunciar o status de cópia. Para o nudge, **não adicionar uma segunda região live** — isso pode causar conflito entre leitores de tela. Em vez disso, o popover usa `role="dialog"` com `aria-label` e anuncia seu conteúdo via foco programático **apenas se o usuário tiver navegação por teclado ativa** (verificável via `document.activeElement`). Para navegação por mouse, a presença visual é suficiente.

```html
<!-- Container visual do popover -->
<div
  role="dialog"
  aria-modal="false"
  aria-label="Avaliar adaptação"
  aria-describedby="nudge-text-{adaptationId}"
>
  <p id="nudge-text-{adaptationId}">
    Gostou desta adaptação? Seu feedback ajuda a melhorar as próximas.
  </p>
  <button onClick={onScrollToFeedback}>Avaliar →</button>
  <button onClick={onNudgeClose} aria-label="Fechar">✕</button>
</div>
```

**Gestão de foco:**
- Foco **não é movido** automaticamente ao abrir o popover
- Pressionar **Escape** chama `onNudgeClose`: implementar via `useEffect` que registra/remove listener em `document` enquanto `showFeedbackNudge === true`, garantindo cleanup na desmontagem
- Ativar ✕ **não move o foco** explicitamente

## Casos de borda

| Situação | Comportamento |
|---|---|
| `adaptation.feedback !== null` ao carregar | `feedbackSubmitted = true`, nudge nunca aparece |
| `adaptation.copyBlock === null` | `CopyActionBar` não é renderizado; nudge nunca aparece |
| Cópia falha (catch) | `setStatus("error")`, `onCopySuccess` não é chamado, nudge não aparece |
| Usuário envia feedback com nudge aberto | `showNudge = false` via `onFeedbackSubmit` |
| Usuário fecha nudge e copia de novo | Nudge reaparece |
| Usuário copia novamente após enviar feedback | `feedbackSubmitted = true`, nudge não aparece |
| Clique em copiar com nudge já aberto | Nenhuma ação adicional (nudge já visível) |
| `onFeedbackSubmit` não fornecido ao `FeedbackForm` | Sem quebra — prop é opcional |
| `feedbackRef.current === null` ao clicar "Avaliar" | Guard no card: `feedbackRef.current?.scrollIntoView(...)` — nenhuma ação |
| API retorna erro HTTP no feedback | `onFeedbackSubmit` não é chamado; nudge permanece aberto |

## Testes

- [ ] Renderiza nudge após cópia bem-sucedida quando `adaptation.feedback === null`
- [ ] Não renderiza nudge quando `adaptation.feedback !== null`
- [ ] Não renderiza nudge quando a cópia falha
- [ ] Fechar via ✕ remove o popover
- [ ] Pressionar Escape remove o popover
- [ ] Copiar novamente após fechar o nudge exibe o nudge novamente
- [ ] Enviar feedback esconde o nudge
- [ ] Copiar novamente após enviar feedback não exibe o nudge
- [ ] Botão "Avaliar" chama `onScrollToFeedback`
- [ ] Nenhum erro quando `feedbackRef.current` é `null` ao chamar scroll
- [ ] `forwardRef`: ref é atribuído ao `<form>` quando fornecido; callers sem ref não quebram

## Arquivos relevantes

- `src/features/exams/results/components/adaptation-result-card.tsx`
- `src/features/exams/results/components/copy-action-bar.tsx`
- `src/features/exams/results/components/feedback-form.tsx`
- `src/features/exams/results/contracts.ts` — `AdaptationResultView.feedback`
