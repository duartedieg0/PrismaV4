# Rollout Playbook

## Objetivo

Conduzir o rollout do `PrismaV2` de forma controlada, sem depender de mudanças no repositório legado.

## Sequência

1. Validar ambiente com `npm run readiness`.
2. Executar o gate completo.
3. Rodar a matriz de regressão das jornadas críticas.
4. Liberar apenas para teste interno.
5. Consolidar achados.
6. Avançar para teste com usuários.

## Critérios de avanço

- zero falhas no gate obrigatório
- apenas `skips` já aceitos na dívida de auth/E2E
- banco compatível com o baseline de migrations
- débitos técnicos conhecidos documentados

## Critérios de bloqueio

- divergência entre banco e migrations do repositório
- falha em auth, upload, adaptação, resultado ou governança admin
- erro não documentado que comprometa fluxo real de professor ou admin
