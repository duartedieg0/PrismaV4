# Release Checklist

## Pré-condições

- Node em baseline do repositório
- `.env.local` válido
- migrations do `supabase/` aplicadas
- `npm run readiness` verde

## Gate obrigatório

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:a11y`
- `npm run test:e2e`

## Antes de teste com usuários

- revisar [rollout-playbook.md](./rollout-playbook.md)
- revisar [rollback-playbook.md](./rollback-playbook.md)
- revisar [regression-matrix.md](./regression-matrix.md)
- revisar [user-testing-playbook.md](./user-testing-playbook.md)
- revisar débitos técnicos ativos antes do teste com usuários
