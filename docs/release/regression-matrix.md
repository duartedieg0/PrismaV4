# Regression Matrix

## Público e acesso

- landing pública renderiza
- `/login` acessível
- `/dashboard` sem sessão redireciona para login
- `/config` e `/users` sem sessão redirecionam para login
- `/blocked` acessível

## Professor

- dashboard lista provas
- nova prova valida formulário
- upload cria exame e inicia processamento
- revisão de extração aceita respostas
- resultado permite cópia e feedback

## Admin

- `/config/models`
- `/config/agents`
- `/config/supports`
- `/config/subjects`
- `/config/grade-levels`
- `/users`
- evolução de agentes em `/config/agents/[id]/evolve`

## Qualidade transversal

- a11y básica das páginas principais
- erros controlados sem tela quebrada
- status de exame coerente entre dashboard, revisão e resultado
