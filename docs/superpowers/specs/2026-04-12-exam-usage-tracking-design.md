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
- A tabela `exams` possui coluna `user_id` (referência ao usuário dono da prova), usada nos queries do admin para agregar por usuário via `exam_usage JOIN exams ON exams.id = exam_usage.exam_id`.

### Sem alterações em `exams`, `questions` ou `adaptations`.

---

## Camada de Código

### 1. Pricing por modelo — `src/gateways/managed-agents/usage.ts`

Expandir o arquivo existente para suportar pricing por model ID. O `model_id` armazenado e passado a `calculateSimpleCost` é sempre `AiModelRecord.modelId` (ex: `"claude-sonnet-4-6"`), **nunca** o formato qualificado do Mastra (`"anthropic/claude-sonnet-4-6"` produzido por `toMastraModelId()`).

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

`CLAUDE_PRICING` é removido. `syncSessionUsage()` passa a chamar `getPricingForModel("claude-sonnet-4-6")` diretamente para obter os quatro campos de pricing (input, output, cacheRead, cacheCreation) — sem alteração funcional. Qualquer outro consumidor de `CLAUDE_PRICING` no codebase deve ser atualizado para usar `getPricingForModel()`.

---

### 2. Agent runners retornam `usage`

Modificar os runners para retornar o usage junto ao resultado estruturado. `response.usage` pode ser `undefined` em situações excepcionais; tratar como `{ promptTokens: 0, completionTokens: 0 }` via `response.usage ?? { promptTokens: 0, completionTokens: 0 }`.

**`src/mastra/agents/extraction-agent-runner.ts`**

```ts
const usage = response.usage ?? { promptTokens: 0, completionTokens: 0 };
return {
  ...extractionOutputSchema.parse(response.object),
  usage: {
    inputTokens: usage.promptTokens,
    outputTokens: usage.completionTokens,
  },
};
```

O tipo de retorno de `runPdfExtractionAgent` passa a incluir `usage: { inputTokens: number; outputTokens: number }`.

**`src/mastra/agents/analysis-agent-runners.ts`**

Mesma mudança em `runBnccAnalysisAgent()`, `runBloomAnalysisAgent()` e `runAdaptationAgent()`.

`runAdaptationAgent` tem dois caminhos internos (essay e objective), cada um com seu próprio `response` de `agent.generate()`. `usage` deve ser capturado do `response` efetivamente chamado em cada branch — a função retorna um único `usage: { inputTokens, outputTokens }` cobrindo a chamada que ocorreu.

---

### 3. Workflows acumulam e persistem usage

#### `src/mastra/workflows/extract-exam-workflow.ts`

- `ExtractionWorkflowDependencies` atualiza o tipo de retorno de `runExtractionAgent` para incluir `usage: { inputTokens: number; outputTokens: number }`.
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
- `extractionPayloadSchema` é extendido com campo `usage` **no nível raiz** (ao lado de `metadata` e `payload`), pois `modelId` vem da etapa de resolução, não do agent:
  ```ts
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
    modelId: z.string(),
  }),
  ```
  Apenas a definição base de `extractionPayloadSchema` precisa ser atualizada. O `persistStep.inputSchema` é definido como extensão de `extractionPayloadSchema` e herdará `usage` automaticamente — não é necessário (nem correto) re-adicionar `usage` no `inputSchema` do `persistStep`.
- `startStep` popula `usage` e `modelId` no output.
- `persistStep` chama `dependencies.persistExamUsage?.()` após persistir as questões (em ambos os caminhos: sucesso e erro — para contabilizar tokens mesmo em runs parciais).

#### `src/mastra/workflows/analyze-and-adapt-workflow.ts`

- Acumular tokens de todas as chamadas (BNCC + Bloom + adaptação) em contadores `totalInputTokens` e `totalOutputTokens` dentro do passo de execução.
- **Modelo para `model_id`**: usar o `model.modelId` do `sharedModelRecord` (modelo de análise). Runs com múltiplos supports e modelos diferentes são considerados fora de escopo para esta feature — o custo acumulado é calculado pro-rata usando `calculateSimpleCost` por chamada com o `modelId` correto de cada chamada, somando os valores de custo. O `model_id` armazenado na linha de `exam_usage` é o do `sharedModelRecord` (representativo da run).
- Chamar `dependencies.persistExamUsage?.()` no passo final, tanto no caminho de sucesso quanto no de erro (tokens já consumidos devem ser registrados independente do resultado).

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
2. Novo query: `exam_usage` JOIN `exams` via `exams.user_id` para agregar por usuário.

Executa os dois queries em paralelo com `Promise.all`. `lastActivityAt` é calculado como o máximo entre `updated_at` de threads e `created_at` de `exam_usage` — garante que usuários que só fazem extrações (sem threads) tenham `lastActivityAt` preenchido.

Combina em `AdminUsageUser` atualizado em `src/features/admin/usage/contracts.ts`:

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
  estimatedCostUSD: number;    // soma total das três categorias
  lastActivityAt: string | null;
};

type AdminUsageTotals = {
  sessions: number;            // total de threads (mantido)
  examCount: number;           // total de provas com usage registrado
  estimatedCostUSD: number;    // soma total incluindo extração e adaptação
};
```

Os componentes de UI que consomem `AdminUsageUser` precisam ser atualizados para lidar com os novos campos opcionais (`examCount`, `costByCategory`).

### `GET /api/admin/usage/[userId]`

Adiciona seção `exams` na resposta. Novo tipo em `contracts.ts`:

```ts
type AdminUsageExam = {
  examId: string;
  topic: string | null;           // campo `topic` da tabela `exams`
  status: string;                  // status atual da prova
  extractionCostUSD: number;
  adaptationCostUSD: number;
  totalCostUSD: number;
  createdAt: string;
};
```

---

## UI Admin

- Coluna "Custo Total" exibida como antes (valor total).
- Ao expandir a linha de um usuário (ou via tooltip), exibir breakdown: **Consultant / Extração / Adaptação**.
- Página de detalhe do usuário: tabela de provas ao lado da tabela de threads.

---

## Fluxo de Dados

```
POST /api/exams (upload PDF)
  └─ runExtraction()
      └─ createExtractExamWorkflow()
          ├─ startStep: runPdfExtractionAgent() → { questions, usage, modelId }
          └─ persistStep: persistExtraction() + persistExamUsage(stage="extraction")
                          [chamado em ambos os caminhos: sucesso e erro]

POST /api/exams/[id]/answers (submete respostas)
  └─ runAnalysisAndAdaptation()
      └─ createAnalyzeAndAdaptWorkflow()
          ├─ executeStep: runBnccAnalysisAgent() + runBloomAnalysisAgent() + runAdaptationAgent()
          │               por question×support → acumula tokens com calculateSimpleCost por chamada
          └─ persistStep: persistAdaptations() + persistExamUsage(stage="adaptation", totalUsage)
                          [chamado em ambos os caminhos: sucesso e erro]
```

---

## Tratamento de Erros

- Se `persistExamUsage` falhar, o fluxo não deve ser interrompido (uso é dado secundário). O `try/catch` silencioso (log apenas) deve ser colocado **na camada de serviço**, no wrapper que constrói a dependência `persistExamUsage` passada ao workflow — não dentro do `persistStep`. Isso mantém o workflow limpo e centraliza o tratamento de falhas de uso no serviço.
- `persistExamUsage` é chamado tanto no caminho de sucesso quanto no de erro dos workflows — tokens já consumidos devem ser registrados mesmo em runs que falharam parcialmente.
- Em caso de re-run (prova reprocessada), `upsert` sobrescreve o registro existente.
- Se `response.usage` vier `undefined` do Mastra, tratar como `{ promptTokens: 0, completionTokens: 0 }`.

---

## Fora de Escopo

- Rastreamento por questão individual ou por chamada de agente.
- Breakdown de custo por support/modelo em runs de adaptação com múltiplos modelos.
- Alertas ou limites de custo.
- Exportação de relatórios de uso.
- Suporte a provedores de AI não-Anthropic.
