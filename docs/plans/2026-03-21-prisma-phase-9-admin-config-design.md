# Prisma Phase 9 Admin Configuration Design

## Objective

Reconstruir o console administrativo completo do produto para governar modelos, agentes, supports, disciplinas, anos/séries e a evolução de prompts, com consistência suficiente para alimentar o runtime Mastra e o fluxo do professor.

## Scope

Esta fase cobre:

- landing do console em `/config`;
- CRUD de `ai_models`;
- CRUD de `agents`;
- CRUD de `supports`;
- CRUD de `subjects`;
- CRUD de `grade_levels`;
- proteção segura de segredos de modelos;
- uso apenas de entidades ativas no fluxo do professor;
- fluxo administrativo de evolução de agentes em `/config/agents/[id]/evolve`;
- histórico mínimo de evolução em `agent_evolutions`.

Esta fase não cobre:

- governança administrativa de usuários, que pertence à Fase 10;
- dashboards analíticos amplos;
- edição client-side de segredos sem proteção;
- plataforma completa de versionamento avançado de prompts além do mínimo operacional.

## Recommended Approach

Implementar o admin por domínio, com módulos separados para `models`, `agents`, `supports` e `curriculum`, e tratar a evolução de agentes como um submódulo do domínio de agentes. Esse desenho permite reaproveitar contratos e validações entre rotas e páginas, mantendo o console desacoplado do legado e coerente com o runtime Mastra da Fase 7.

## Architecture

```text
Admin UI
  -> validated admin feature services
  -> route handlers
  -> Supabase persistence
  -> propagation to teacher form + Mastra runtime

Agent evolution
  -> eligible feedback loader
  -> Mastra evolve-agent service
  -> prompt comparison
  -> accept/reject decision
  -> agent_evolutions history + agent prompt update
```

### Module shape

```text
src/features/admin/
  shared/
  models/
  agents/
    evolution/
  supports/
  curriculum/
```

### Data ownership

- leitura e mutação administrativas: serviços por domínio;
- mascaramento de segredo: módulo de modelos;
- selects ativos consumidos pelo professor: serviços de catálogo existentes continuam sendo a fonte única;
- evolução de agente: submódulo de agentes com persistência em `agent_evolutions`.

## Data Flow

### Configuration console

1. O admin acessa `/config` e navega por cards da área.
2. Cada página carrega seu catálogo via rota administrativa autenticada e autorizada.
3. Mutations passam por validação Zod, regras de habilitação/desabilitação e persistência Supabase.
4. A resposta volta já normalizada para a UI.
5. O fluxo do professor continua lendo apenas entidades ativas, sem duplicar regra no frontend.

### Models

1. O admin cria/edita modelo com nome, provider, base URL, model ID, segredo e flags de habilitação/default.
2. O segredo nunca volta integralmente para o client.
3. Desabilitar ou excluir modelo trata supports vinculados sem quebrar histórico.

### Agents and evolution

1. O admin gerencia agentes com nome, objetivo, prompt atual, versão e estado.
2. Em `/config/agents/[id]/evolve`, o sistema lista feedbacks elegíveis já ligados ao agente.
3. O admin seleciona feedbacks e dispara a evolução via runtime Mastra.
4. O sistema retorna comparação entre prompt atual e sugerido.
5. Ao aceitar, atualiza o agente e persiste histórico mínimo; ao rejeitar, preserva apenas o registro da evolução.

### Supports and curriculum

1. Supports vinculam nome, agente, modelo e estado.
2. Subjects e grade levels seguem CRUD simples com habilitação.
3. O formulário `/exams/new` continua usando apenas entidades ativas já publicadas por essas tabelas.

## Error Handling

- acesso não admin: redirect/forbidden consistente;
- payload inválido: `400` com erro por campo;
- entidade inexistente: `404` estável;
- support com agent/model inválido ou desabilitado: erro explícito;
- atualização sem nova secret key: preservar valor anterior;
- falha na evolução: não alterar prompt atual nem deixar estado parcialmente aceito;
- falha na decisão de aceite/rejeição: manter histórico rastreável e UX recuperável.

## Testing Strategy

- unit para validações administrativas por entidade;
- integration para CRUD de models, agents, supports, subjects e grade levels;
- integration para regras críticas:
  - único modelo default;
  - mascaramento de segredo;
  - desabilitação de modelo com impacto em supports;
  - filtro de entidades ativas consumidas por `/exams/new`;
- unit/integration para evolução de agentes:
  - carga de feedback elegível;
  - chamada ao runtime Mastra;
  - persistência em `agent_evolutions`;
  - aceite e rejeição;
- UI tests das páginas e formulários principais;
- a11y das superfícies críticas do admin;
- E2E para CRUDs centrais e fluxo de evolução.

## Technical Notes

- a Fase 9 pode exigir migration incremental para suportar versionamento mínimo de agentes e papel/default de modelos sem quebrar o baseline legado;
- a UI do admin deve seguir o design system existente, mas corrigindo o shell placeholder atual;
- secrets devem ficar sempre confinados a handlers/server components;
- a evolução de agente deve usar o runtime Mastra já consolidado, não o edge function legado.
