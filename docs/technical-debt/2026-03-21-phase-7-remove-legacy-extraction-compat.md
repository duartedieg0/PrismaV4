# Technical Debt: Remove Legacy Extraction Compatibility Code

## Context

A Fase 7 migrou a trilha principal de IA para Mastra:

- criação de prova usa `runExtraction` + `extractExamWorkflow`;
- submissão de respostas usa `runAnalysisAndAdaptation` + `analyzeAndAdaptWorkflow`;
- o runtime central foi registrado em `src/mastra/runtime.ts`.

Com isso, o código legado de extração deixou de participar do fluxo principal, mas ainda foi mantido para cobertura de regressão e comparação comportamental.

## Isolated Compatibility Surface

- `src/features/exams/extraction/process-extraction.ts`
- `src/gateways/extraction/legacy-extraction.ts`
- testes unit/integration que ainda validam essa trilha compatível

Esses módulos agora estão explicitamente marcados como `@deprecated` e não devem voltar a ser usados em rotas ou serviços novos.

## Why It Remains

- preserva regressão controlada enquanto a migração Mastra amadurece;
- evita remoção precipitada de cobertura útil no mesmo bloco em que a troca da runtime foi concluída;
- mantém uma referência comportamental curta para debugging caso a extração nova apresente divergência.

## Removal Trigger

Remover esse código quando:

- a Fase 7 estiver estabilizada em ambiente real sem fallback para a edge function antiga;
- o gate completo da aplicação permanecer verde por pelo menos um ciclo de desenvolvimento após a migração;
- não houver mais investigação ativa comparando saída Mastra vs. pipeline legado.

## Removal Scope

- apagar os dois módulos legados;
- apagar os testes que só exercitam essa compat layer;
- manter apenas os testes cobrindo `runExtraction`, `extractExamWorkflow` e os pontos de entrada reais do app.
