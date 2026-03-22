# Release Docs

Esta pasta concentra os artefatos operacionais do `PrismaV2` para rollout controlado e teste com usuários.

Arquivos principais:

- `release-checklist.md`
- `rollout-playbook.md`
- `rollback-playbook.md`
- `regression-matrix.md`
- `user-testing-playbook.md`

Ordem recomendada:

1. rodar `npm run readiness`
2. executar o gate completo
3. seguir `release-checklist.md`
4. conduzir o rollout conforme `rollout-playbook.md`
5. usar `regression-matrix.md` e `user-testing-playbook.md` na validação
