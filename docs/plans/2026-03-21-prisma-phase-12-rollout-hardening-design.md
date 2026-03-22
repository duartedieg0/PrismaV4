# Prisma Phase 12 Rollout, Hardening and User-Testing Readiness Design

## Objective

Fechar o programa de rebuild no `PrismaV2`, deixando o repositório pronto para validação com usuários por meio de readiness checks executáveis, playbooks operacionais e critérios explícitos de release, rollback e regressão.

## Scope

Esta fase cobre:

- readiness check executável para ambiente, Node, variáveis e baseline de migrations;
- documentação operacional de release, rollout, rollback e teste com usuários;
- matriz de regressão manual das jornadas críticas;
- atualização final do `README` com setup operacional;
- consolidação do estado atual de débitos técnicos aceitos no contexto do rollout.

Esta fase não cobre:

- alterações em `/Users/iduarte/Documents/Teste/Prisma`;
- alterações em `/Users/iduarte/Downloads/Prisma`;
- novos workflows ou features de produto;
- observabilidade externa avançada além do que já está no repositório.

## Recommended Approach

Adicionar uma camada enxuta de hardening operacional diretamente no `PrismaV2`: um script de readiness, documentação versionada de operação e testes leves que garantem a presença desses artefatos. Isso fecha a entrega sem criar uma infraestrutura paralela ou inflar escopo.

## Architecture

```text
Repo readiness
  -> environment + node + migration baseline checks
  -> release docs and regression matrix
  -> user-testing playbook
  -> final quality gate
```

### Module shape

```text
scripts/
  readiness-check.mjs

docs/release/
  README.md
  release-checklist.md
  rollout-playbook.md
  rollback-playbook.md
  regression-matrix.md
  user-testing-playbook.md

src/test/features/release/
  readiness-check.test.ts
  release-docs.test.ts
```

### Data ownership

- `schema-baseline.ts` continua sendo a fonte de verdade programática de migrations esperadas;
- o script de readiness apenas consome esse contrato e o ambiente local;
- os playbooks são artefatos operacionais estáticos, versionados no repositório.

## Data Flow

1. O operador roda `npm run readiness`.
2. O script valida:
   - versão do Node;
   - variáveis obrigatórias;
   - presença das migrations esperadas;
   - existência dos playbooks críticos.
3. O operador consulta `docs/release/` para:
   - checklist de release;
   - rollout controlado;
   - rollback;
   - regressão manual;
   - roteiro de teste com usuários.
4. O gate de qualidade continua como validação final antes de liberar o V2 para testes com usuários.

## Error Handling

- ambiente inválido deve falhar com mensagem objetiva e acionável;
- ausência de migration esperada deve falhar;
- ausência de credencial opcional de E2E autenticado deve virar warning, não falha, se já for dívida aceita;
- ausência de playbook obrigatório deve falhar;
- o readiness check deve ser determinístico e sem side effects no banco.

## Testing Strategy

- unit para o summarizer/contrato do readiness;
- testes de filesystem para garantir a presença dos artefatos operacionais;
- execução manual do `npm run readiness`;
- gate completo de lint, typecheck, build, test, a11y e e2e.

## Technical Notes

- a dívida aceita de auth/E2E Supabase continua documentada e deve aparecer como limitação conhecida no material de rollout;
- a Fase 12 não substitui o gate de qualidade, ela formaliza quando e como esse gate deve ser usado para liberar teste com usuários;
- o resultado final da fase é um repositório operacionalmente legível, não uma nova feature de produto.
