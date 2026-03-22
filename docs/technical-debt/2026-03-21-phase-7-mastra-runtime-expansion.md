# Technical Debt: Future Expansion of the Mastra Runtime

## Context

Na Fase 7 foi escolhida a abordagem de runtime vertical mínimo: migrar extração e análise/adaptação para Mastra sem antecipar toda a superfície futura do produto.

Essa decisão reduz risco e mantém a ordem canônica do plano, mas deixa intencionalmente parte da arquitetura mais ampla para uma iteração posterior.

## Deferred Work

- ampliar o provider registry para todos os casos futuros de governança e experimentação;
- estruturar desde já prompts, versionamento e ownership administrativo completos;
- preparar `evolveAgentWorkflow` e toda a cadeia de evidências/feedbacks;
- expandir observability para exporters externos e dashboards operacionais;
- consolidar um runtime genérico para futuros pipelines além de extração e adaptação.

## Why Deferred

- a Fase 7 precisa entregar valor funcional imediato nas jornadas já implementadas;
- a evolução de agentes pertence mais naturalmente ao bloco admin/gov da plataforma;
- ampliar a superfície agora aumentaria acoplamento, tempo de execução e risco de retrabalho.

## Trigger For Resolution

Resolver este débito quando as fases de configuração/admin e governança de agentes estiverem em execução, ou quando o runtime atual começar a apresentar duplicação estrutural relevante para novos workflows.
