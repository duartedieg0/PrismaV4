# Spec: Rastreamento de Tokens para Extração e Adaptação de Provas

**Data:** 2026-04-12
**Status:** Aprovado

---

## Contexto

O sistema já rastreia tokens e custo estimado de threads do tea-consultant (Claude Managed Agents) na tabela `consultant_threads`, com visualização na página de admin de usage.

A extração de questões de provas e a adaptação de questões (via workflows Mastra) também consomem tokens de LLM, mas esse consumo não é registrado hoje. Os agents usam `agent.generate()` (Vercel AI SDK via Mastra), cujo retorno já expõe `response.usage` com `promptTokens` e `completionTokens` — dado que atualmente é ignorado.

---

## Objetivo

Expandir o rastreamento de uso de tokens para cobrir:
1. **Extração de questões** — uma chamada de agente por prova (PDF → questões)
2. **Adaptação de questões** — múltiplas chamadas por prova: análise BNCC + Bloom por questão, adaptação por questão × suporte

O custo é agregado por prova por etapa e exibido de forma unificada na página de admin de usage, com breakdown por categoria.

---

## Decisões de Design

| Decisão | Escolha | Razão |
|---|---|---|
| Granularidade | Por prova (agregado) | Simples para visualização e armazenamento |
| Armazenamento | Nova tabela `exam_usage` | Separação de concerns, consultável por etapa |
| Pricing | Dinâmico por model ID | Extração/adaptação usam modelos configuráveis |
| Camada de acumulação | Workflows | Já possuem passo de persistência; mantém coesão |
| Admin view | Unificado com breakdown | Custo total = consultant + extração + adaptação |

---

## Banco de Dados

### Nova tabela `exam_usage`

```sql
CREATE TABLE exam_usage (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id             UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  stage               TEXT NOT NULL CHECK (stage IN ('extraction', 'adaptation')),
  model_id            TEXT NOT NULL,
  input_tokens        INTEGER NOT NULL DEFAULT 0,
  output_tokens       INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd  NUMERIC(12,6) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX exam_usage_exam_stage_idx ON exam_usage (exam_id, stage);
```

- Um registro por prova por etapa.
- `UNIQUE (exam_id, stage)` permite `upsert` seguro em caso de re-run.
- Cascade delete garante limpeza automática ao excluir uma prova.

### Sem alterações em `exams`, `questions` ou `adaptations`.

---

## Camada de Código

### 1. Pricing por modelo — `src/gateways/managed-agents/usage.ts`

Expandir o arquivo existente para suportar pricing por model ID:

```ts
type ModelPricing = {
  inputPerMillion: number;
  outputPerMillion: number;
  cacheReadPerMillion?: number;
  cacheCreationPerMillion?: number;
};

export const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-sonnet-4-6": { inputPerMillion: 0.80,  outputPerMillion: 4.00,  cacheReadPerMillion: 0.08,  cacheCreationPerMillion: 1.00 },
  "claude-haiku-4-5":  { inputPerMillion: 0.08,  outputPerMillion: 0.40,  cacheReadPerMillion: 0.008, cacheCreationPerMillion: 0.10 },
  "claude-opus-4-6":   { inputPerMillion: 15.00, outputPerMillion: 75.00, cacheReadPerMillion: 1.50,  cacheCreationPerMillion: 18.75 },
};

export function getPricingForModel(modelId: string): ModelPricing {
  return MODEL_PRICING[modelId] ?? MODEL_PRICING["claude-sonnet-4-6"];
}

export function calculateSimpleCost(
  usage: { inputTokens: number; outputTokens: number },
  modelId: string,
): number {
  const pricing = getPricingForModel(modelId);
  return (
    (usage.inputTokens / 1_000_000) * pricing.inputPerMillion +
    (usage.outputTokens / 1_000_000) * pricing.outputPerMillion
  );
}
```

`CLAUDE_PRICING` e `syncSessionUsage()` permanecem sem alteração (Managed Agents usa cache tokens que o Mastra não expõe).

---

### 2. Agent runners retornam `usage`

Modificar os runners para retornar o usage junto ao resultado estruturado.

**`src/mastra/agents/extraction-agent-runner.ts`**

```ts
// Antes: return extractionOutputSchema.parse(response.object);
// Depois:
return {
  ...extractionOutputSchema.parse(response.object),
  usage: {
    inputTokens: response.usage.promptTokens,
    outputTokens: response.usage.completionTokens,
  },
};
```

**`src/mastra/agents/analysis-agent-runners.ts`**

Mesma mudança em `runBnccAnalysisAgent()`, `runBloomAnalysisAgent()` e `runAdaptationAgent()` — cada função retorna `usage: { inputTokens, outputTokens }` junto ao resultado.

---

### 3. Workflows acumulam e persistem usage

#### `src/mastra/workflows/extract-exam-workflow.ts`

- `ExtractionWorkflowDependencies` recebe nova dependência opcional:
  ```ts
  persistExamUsage?(input: {
    examId: string;
    stage: "extraction" | "adaptation";
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  }): Promise<void>;
  ```
- `startStep` passa `usage` e `modelId` no schema de saída.
- `persistStep` chama `dependencies.persistExamUsage?.()` após persistir as questões.

#### `src/mastra/workflows/analyze-and-adapt-workflow.ts`

- Acumular `inputTokens` e `outputTokens` de todas as chamadas (BNCC + Bloom + adaptação) dentro do passo de execução.
- Chamar `dependencies.persistExamUsage?.()` no passo final com o total e o `modelId` do modelo de adaptação.

---

### 4. Gateway de persistência — `src/gateways/exam-usage/persist.ts`

```ts
export async function persistExamUsage(
  supabase: SupabaseClient,
  input: {
    examId: string;
    stage: "extraction" | "adaptation";
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  },
): Promise<void> {
  await supabase
    .from("exam_usage")
    .upsert(
      {
        exam_id: input.examId,
        stage: input.stage,
        model_id: input.modelId,
        input_tokens: input.inputTokens,
        output_tokens: input.outputTokens,
        estimated_cost_usd: input.estimatedCostUsd,
      },
      { onConflict: "exam_id,stage" },
    );
}
```

---

### 5. Serviços injetam a dependência

`src/services/ai/run-extraction.ts` e `src/services/ai/run-analysis-and-adaptation.ts` passam a fornecer `persistExamUsage` como dependência aos workflows, instanciando-a com o cliente Supabase disponível no contexto.

---

## API Admin

### `GET /api/admin/usage`

Executa dois queries em paralelo:
1. Query existente em `consultant_threads` (inalterada).
2. Novo query: `exam_usage` JOIN `exams` para obter `user_id`, agrupado por `user_id` e `stage`.

Combina em `AdminUsageUser`:

```ts
type AdminUsageUser = {
  userId: string;
  name: string | null;
  email: string | null;
  threadCount: number;
  examCount: number;           // provas com ao menos um registro em exam_usage
  costByCategory: {
    consultant: number;
    extraction: number;
    adaptation: number;
  };
  estimatedCostUSD: number;    // soma total
  lastActivityAt: string | null;
};
```

### `GET /api/admin/usage/[userId]`

Adiciona seção `exams` na resposta, listando provas com `extractionCostUSD`, `adaptationCostUSD` e `totalCostUSD`.

---

## UI Admin

- Coluna "Custo Total" exibida como antes.
- Ao expandir a linha de um usuário (ou via tooltip), exibir breakdown: **Consultant / Extração / Adaptação**.
- Página de detalhe do usuário: tabela de provas ao lado da tabela de threads.

---

## Fluxo de Dados

```
POST /api/exams (upload PDF)
  └─ runExtraction()
      └─ createExtractExamWorkflow()
          ├─ startStep: runPdfExtractionAgent() → { questions, usage }
          └─ persistStep: persistExtraction() + persistExamUsage(stage="extraction")

POST /api/exams/[id]/answers (submete respostas)
  └─ runAnalysisAndAdaptation()
      └─ createAnalyzeAndAdaptWorkflow()
          ├─ executeStep: runBnccAnalysisAgent() + runBloomAnalysisAgent() + runAdaptationAgent() per question×support → acumula usage
          └─ persistStep: persistAdaptations() + persistExamUsage(stage="adaptation", totalUsage)
```

---

## Tratamento de Erros

- Se `persistExamUsage` falhar, o fluxo não deve ser interrompido (uso é dado secundário).
- Implementar com `try/catch` silencioso (log apenas) na camada de serviço.
- Em caso de re-run (prova reprocessada), `upsert` sobrescreve o registro existente.
- Se `response.usage` vier `undefined` do Mastra (improvável mas possível), tratar como `{ inputTokens: 0, outputTokens: 0 }`.

---

## Fora de Escopo

- Rastreamento por questão individual ou por chamada de agente.
- Alertas ou limites de custo.
- Exportação de relatórios de uso.
- Suporte a provedores de AI não-Anthropic.
