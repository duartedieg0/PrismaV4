# User Testing Playbook

## Objetivo

Executar testes com usuários no `PrismaV2` com escopo controlado e coleta objetiva de achados.

## Antes de iniciar

- executar `npm run readiness`
- completar o gate obrigatório
- revisar a matriz de regressão
- alinhar escopo do teste: professor, admin ou ambos

## Sessões recomendadas

### Professor

- login
- criação de nova prova
- revisão da extração
- leitura do resultado
- envio de feedback

### Admin

- revisão de modelos e agentes
- CRUD de supports, subjects e grade levels
- governança de usuários
- evolução de prompts do agente

## Registro de achados

Registrar sempre:

- jornada
- papel do usuário
- rota afetada
- dados usados
- resultado esperado
- resultado obtido
- severidade

## Limitações conhecidas

- os `skips` autenticados de E2E ligados à infra Supabase já aceita continuam sendo limitação conhecida até fechamento da dívida correspondente
