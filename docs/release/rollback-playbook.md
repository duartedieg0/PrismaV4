# Rollback Playbook

## Objetivo

Descrever rollback operacional do `PrismaV2` sem editar o legado.

## Quando executar rollback

- bloqueador em fluxo crítico descoberto durante teste com usuários
- regressão de dados ou autorização
- falha operacional sem workaround seguro

## Passos

1. interromper novos testes com usuários no `PrismaV2`
2. preservar evidências: logs, inputs, exam ids e user ids afetados
3. registrar o bloqueador e classificar severidade
4. reverter apenas a decisão operacional de uso do `PrismaV2`
5. corrigir no `PrismaV2`, rerodar gate e repetir regressão antes de novo rollout

## O que não fazer

- não editar `/Users/iduarte/Documents/Teste/Prisma`
- não editar `/Users/iduarte/Downloads/Prisma`
- não aplicar rollback destrutivo de banco sem plano explícito
