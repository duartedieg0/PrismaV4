# Prisma Phase 11 Agent Evolution Design

## Objective

Concluir a migração da evolução de agentes para o runtime Mastra, preservando a superfície administrativa já entregue e adicionando rastreabilidade explícita entre sugestão aceita, versão do prompt e futuras adaptações.

## Scope

Esta fase cobre:

- workflow Mastra `evolveAgentWorkflow`;
- contratos de runtime para evolução;
- prompt versionado e agent runner específico para evolução;
- integração da rota admin `/api/admin/agents/[id]/evolve` com o workflow;
- persistência de proposta, aceite/rejeição e metadados de versão em `agent_evolutions`;
- comparação lado a lado e resolução administrativa na UI já existente;
- vínculo entre agente/version atual e futuras execuções de adaptação.

Esta fase não cobre:

- governança avançada de experimentos/evals;
- múltiplos candidatos de prompt por execução;
- dashboards analíticos de evolução;
- mudanças adicionais no console admin fora da trilha de evolução.

## Recommended Approach

Implementar uma trilha vertical Mastra para evolução, análoga às fases 7 e 8: o admin continua usando a tela existente, mas a geração da proposta passa por um workflow explícito, com contratos, eventos e persistência testável. O código legado de sugestão direta com `generateText` deixa de ser o caminho principal e passa a poder ser removido depois sem ambiguidade.

## Architecture

```text
Admin evolve page
  -> POST /api/admin/agents/[id]/evolve
  -> runAgentEvolution
  -> evolveAgentWorkflow
  -> select model + load feedback context + run evolution agent
  -> persist proposal in agent_evolutions
  -> PATCH accept/reject
  -> update agents.prompt + agents.version
  -> future adaptations observe active agent version
```

### Module shape

```text
src/mastra/
  contracts/evolution-contracts.ts
  prompts/evolution-prompt.ts
  agents/agent-evolution-runner.ts
  workflows/evolve-agent-workflow.ts

src/services/ai/
  run-agent-evolution.ts

src/features/admin/agents/evolution/
  contracts.ts
  service.ts
```

### Data ownership

- seleção de feedbacks e modelo: rota/service admin;
- geração da sugestão: workflow Mastra;
- persistência da proposta: step do workflow;
- aceite/rejeição: rota admin com update transacional lógico;
- vínculo de versão futura: metadados de agente/version consumidos pela trilha de adaptação já existente.

## Data Flow

### Suggestion generation

1. Admin seleciona feedbacks elegíveis em `/config/agents/[id]/evolve`.
2. A rota valida acesso, agente e feedbacks.
3. O sistema resolve o modelo de evolução.
4. `runAgentEvolution` executa `evolveAgentWorkflow`.
5. O workflow:
   - cria metadata de execução;
   - gera prompt estruturado a partir de agente atual + feedbacks;
   - executa o agent de evolução;
   - valida `suggestedPrompt` e `commentary`;
   - persiste a proposta em `agent_evolutions`.
6. A UI recebe a proposta e abre o comparador.

### Suggestion resolution

1. Admin aceita ou rejeita a proposta.
2. A rota marca a evolução como resolvida.
3. Se aceita:
   - atualiza `agents.prompt`;
   - incrementa `agents.version`;
   - registra a versão aceita na evolução.
4. Adaptações futuras passam a carregar essa nova versão do agente.

## Error Handling

- agente inexistente: `404`;
- feedbacks inválidos ou inelegíveis: `400`;
- ausência de modelo válido para evolução: `400`;
- retorno inválido do runtime Mastra: erro controlado, sem inserir evolução inconsistente;
- falha ao persistir evolução: request falha;
- falha ao aceitar sugestão: não alterar agente parcialmente;
- rejeição deve apenas resolver a sugestão, sem tocar no agente ativo.

## Testing Strategy

- unit para contratos e prompt de evolução;
- unit para o runner/normalização da resposta do agent;
- unit para o workflow Mastra de evolução;
- unit/integration para `runAgentEvolution`;
- route tests para `POST` e `PATCH` do evolve;
- integration para persistência e aceite com incremento de versão;
- UI tests do comparador e da página admin;
- a11y da superfície de evolução;
- E2E do fluxo administrativo principal de evolução, respeitando os `skips` autenticados já aceitos quando dependentes da dívida de infra.

## Technical Notes

- a persistência em `agent_evolutions` precisa guardar informações suficientes para auditoria da decisão administrativa e da versão promovida;
- a integração com a adaptação já existente deve usar a versão atual do agente, não uma constante global de prompt;
- a antiga implementação ad hoc de sugestão deve sair do caminho principal e ficar apta à remoção como dívida técnica separada, se ainda restar código morto após a migração.
