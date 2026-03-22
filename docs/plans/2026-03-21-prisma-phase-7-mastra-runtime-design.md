# Prisma Phase 7 Mastra Runtime Design

## Objective

Migrar a camada inteligente central do PrismaV2 para um runtime Mastra explícito, cobrindo extração de questões e análise/adaptação, sem antecipar a trilha de evolução de agentes.

## Scope

**Pré-requisito obrigatório:** concluir a Fase 7 Pre Req de upgrade para Node `22.13+` antes de continuar esta fase em execução real.

Esta fase cobre:

- criação do runtime `src/mastra/`;
- contratos explícitos de input/output para workflows e agentes;
- resolução centralizada de modelos com fallback e bloqueio de modelos desabilitados;
- `extractExamWorkflow`;
- `analyzeAndAdaptWorkflow`;
- integração dos workflows Mastra com os serviços e rotas já existentes no app;
- tracing/logs/metadados mínimos para observabilidade do produto.

Esta fase não cobre:

- `evolveAgentWorkflow`;
- telas administrativas de governança de prompts/agentes além do necessário para contratos;
- observabilidade externa avançada;
- evals amplos de prompts.

## Recommended Approach

Implementar um runtime vertical mínimo, porém completo o bastante para substituir os fluxos centrais de IA já usados pelas fases 5 e 6.

O app Next.js continua responsável por auth, UI, rotas e serviços de domínio. O runtime Mastra vira a camada de orquestração inteligente. As features do produto não chamam providers ou prompts diretamente; chamam serviços/workflows.

## Architecture

```text
Next route / domain service
  -> application-facing AI service
  -> Mastra workflow
  -> Mastra agents + tools
  -> Supabase persistence + runtime logs
  -> status/result returned to product flow
```

### Runtime structure

```text
src/mastra/
  index.ts
  contracts/
  observability/
  prompts/
  providers/
  tools/
  agents/
  workflows/
```

### Responsibility split

- `contracts/`: input/output, execution metadata, failure semantics
- `providers/`: model registry, selection policies, provider instantiation
- `tools/`: leitura/persistência em Supabase, logging de eventos, carregamento de contexto
- `agents/`: extraction, BNCC, Bloom, adaptation
- `workflows/`: compose tools/agents into product pipelines
- `observability/`: trace metadata, logger bridge, correlation id propagation

## Data Flow

### Extraction

1. A fase 5 cria a prova e a deixa em `extracting`.
2. O serviço de extração invoca `extractExamWorkflow`.
3. O workflow carrega exame, PDF e configuração de modelo.
4. O agente de extração produz payload estruturado.
5. O workflow normaliza, persiste questões e warnings, e atualiza o exame para `awaiting_answers` ou `error`.

### Analyze and adapt

1. A fase 6 salva respostas corretas e inicia o processamento.
2. O serviço de adaptação invoca `analyzeAndAdaptWorkflow`.
3. O workflow carrega exame, questões, supports, agentes e modelos.
4. Executa análise BNCC e Bloom por questão.
5. Executa adaptação por support.
6. Persiste análises/adaptações e atualiza o progresso/status final.

## Error Handling

- modelo desabilitado: falha determinística com mensagem estável;
- ausência de modelo aplicável: falha explícita, sem fallback implícito além da política configurada;
- falha transitória de provider: erro observável e pronto para retry controlado;
- falha de contrato do output do agente: erro definitivo da etapa;
- falha de persistência: workflow não mascara o erro nem marca sucesso parcial incorreto.

## Testing Strategy

- unit para contratos, model registry e policies;
- integration para tools com Supabase mockado;
- integration para workflows com agents/tools fakeados;
- smoke tests de shape de output;
- regressão nos serviços/rotas já existentes que passam a usar o runtime Mastra.

## Technical Debt Boundary

A expansão para um runtime mais amplo, com estrutura antecipada para todos os workflows futuros, fica registrada como débito técnico separado. Isso preserva foco na migração dos fluxos centrais sem fechar a porta para a arquitetura mais abrangente depois.
