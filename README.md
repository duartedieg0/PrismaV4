# PrismaV2

Rebuild do Adapte Minha Prova em Next.js 16, Supabase e runtime Mastra.

## Runtime

Este projeto requer Node `22.13.0` ou superior. A baseline fixada no repositório é `22.22.1`.

Arquivos de referência no repositório:

- `.nvmrc`
- `.node-version`
- `package.json` em `engines.node`

## Setup

```bash
nvm use
npm install
npm run readiness
```

Se a sua máquina ainda estiver em Node 20, a Fase 7 não deve continuar. O runtime atual do Mastra adotado pelo projeto exige Node 22.13+.

## Quality Gate

```bash
npm run readiness
npm run lint
npm run typecheck
npm run build
npm run test
npm run test:a11y
npm run test:e2e
```

## Release And User Testing

Artefatos operacionais estão em `docs/release/`.

Fluxo recomendado:

1. `npm run readiness`
2. gate completo
3. seguir `docs/release/release-checklist.md`
4. executar a matriz em `docs/release/regression-matrix.md`
5. conduzir sessões conforme `docs/release/user-testing-playbook.md`

Referência histórica:

- a dívida original de auth/E2E Supabase foi revalidada e encerrada em `docs/technical-debt/2026-03-21-phase-4-supabase-auth-e2e.md`
