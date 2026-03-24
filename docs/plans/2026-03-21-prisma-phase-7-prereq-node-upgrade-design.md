# Prisma Phase 7 Pre Req Node Upgrade Design

## Objective

Garantir que o PrismaV2 rode em uma versão de Node compatível com o Mastra atual e que esse requisito esteja alinhado entre ambiente local, CI e documentação do repositório.

## Scope

Esta fase cobre:

- definição explícita da versão mínima de Node para o projeto;
- alinhamento da versão entre `package.json`, arquivos de version manager e CI;
- documentação curta de setup para desenvolvimento local;
- revalidação das fases já concluídas após a troca para o novo baseline.

Esta fase não cobre:

- mudanças funcionais do produto;
- migração de código da Fase 7 além da fundação já iniciada;
- qualquer workaround para manter Mastra em Node 20.

## Recommended Approach

Aplicar um prerequisito de plataforma explícito para Node `22.13+`, que é a exigência do Mastra 1.x já adotado no projeto.

Isso mantém o repositório coerente com as dependências já instaladas e evita continuar a Fase 7 em um runtime fora da compatibilidade oficial.

## Implementation Surface

- `package.json`: declarar `engines.node`
- `.nvmrc`: fixar a versão recomendada de desenvolvimento
- `.node-version`: compatibilidade com outros gerenciadores
- `.github/workflows/ci.yml`: usar a mesma linha de Node
- `README.md`: documentar o requisito e o fluxo básico de bootstrap

## Validation Strategy

Depois de trocar o Node local para a versão declarada, rerodar:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:a11y`
- `npm run test:e2e`

## Success Criteria

- o requisito de Node deixa de ser implícito;
- CI e desenvolvimento local usam a mesma baseline;
- a Fase 7 pode seguir sem incompatibilidade estrutural com Mastra.
