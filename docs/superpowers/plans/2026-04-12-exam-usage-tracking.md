# Exam Usage Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar e exibir o custo de tokens de extração e adaptação de provas na página de admin de usage, junto ao custo do tea-consultant.

**Architecture:** Os Mastra agent runners já expõem `response.usage` (Vercel AI SDK) com `promptTokens` e `completionTokens`. A mudança propaga esse dado pelos runners → dependências dos workflows → workflows (que acumulam e chamam `persistExamUsage`) → services (que injetam a dependência com try/catch). Uma nova tabela `exam_usage` armazena um registro por prova por etapa. O admin combina `consultant_threads` e `exam_usage` em uma única view com breakdown por categoria.

**Tech Stack:** TypeScript, Next.js (App Router), Supabase (PostgreSQL), Mastra workflows, Vitest

**Spec:** `docs/superpowers/specs/2026-04-12-exam-usage-tracking-design.md`

---

## File Map

### Criar
- `supabase/migrations/00017_exam_usage.sql` — nova tabela com índice único
- `src/gateways/exam-usage/persist.ts` — upsert em `exam_usage`
- `src/test/gateways/usage-pricing.test.ts` — testes de pricing por modelo
- `src/test/gateways/exam-usage-persist.test.ts` — testes do gateway
- `src/features/admin/usage/components/usage-exams-table.tsx` — tabela de provas por usuário

### Modificar
- `src/gateways/managed-agents/usage.ts` — adicionar `MODEL_PRICING`, `getPricingForModel`, `calculateSimpleCost`; remover `CLAUDE_PRICING`; atualizar `syncSessionUsage`
- `src/mastra/agents/extraction-agent-runner.ts` — retornar `usage`
- `src/mastra/agents/analysis-agent-runners.ts` — retornar `usage` em todos os 3 runners
- `src/mastra/workflows/extract-exam-workflow.ts` — atualizar dep type, schema, startStep e persistStep
- `src/mastra/workflows/analyze-and-adapt-workflow.ts` — atualizar dep type, acumular tokens, chamar persistExamUsage
- `src/services/ai/run-extraction.ts` — injetar `persistExamUsage` com try/catch
- `src/services/ai/run-analysis-and-adaptation.ts` — injetar `persistExamUsage` com try/catch
- `src/features/admin/usage/contracts.ts` — atualizar `AdminUsageUser`, `AdminUsageTotals`; adicionar `AdminUsageExam`, `AdminUsageUserDetail`
- `src/app/(admin)/usage/page.tsx` — carregar `exam_usage` e combinar com threads
- `src/app/(admin)/usage/[userId]/page.tsx` — carregar `exam_usage` do usuário
- `src/app/api/admin/usage/route.ts` — idem ao page.tsx
- `src/app/api/admin/usage/[userId]/route.ts` — idem ao [userId]/page.tsx
- `src/features/admin/usage/components/usage-users-table.tsx` — exibir breakdown de custo
- `src/test/mastra/extraction-agent-runner.test.ts` — atualizar mocks, adicionar assertion de `usage`
- `src/test/mastra/analysis-agent-runners.test.ts` — atualizar mocks, adicionar assertions de `usage`
- `src/test/mastra/extract-exam-workflow.test.ts` — atualizar mocks, adicionar assertions de `persistExamUsage`
- `src/test/mastra/analyze-and-adapt-workflow.test.ts` — atualizar mocks, adicionar assertions
- `src/test/services/run-extraction.test.ts` — atualizar mocks
- `src/test/services/run-analysis-and-adaptation.test.ts` — atualizar mocks

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/00017_exam_usage.sql`

- [ ] **Step 1: Criar o arquivo de migração**

```sql
-- supabase/migrations/00017_exam_usage.sql

CREATE TABLE IF NOT EXISTS public.exam_usage (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id             UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  stage               TEXT NOT NULL CHECK (stage IN ('extraction', 'adaptation')),
  model_id            TEXT NOT NULL,
  input_tokens        INTEGER NOT NULL DEFAULT 0,
  output_tokens       INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd  NUMERIC(12,6) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS exam_usage_exam_stage_idx
  ON public.exam_usage (exam_id, stage);

-- Acesso de leitura/escrita apenas para o service role (backend)
ALTER TABLE public.exam_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to exam_usage"
  ON public.exam_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/00017_exam_usage.sql
git commit -m "feat(db): add exam_usage table for extraction and adaptation token tracking"
```

---

## Task 2: Refatorar pricing por modelo em `usage.ts`

**Files:**
- Modify: `src/gateways/managed-agents/usage.ts`
- Create: `src/test/gateways/usage-pricing.test.ts`

- [ ] **Step 1: Escrever o teste com falha**

```ts
// src/test/gateways/usage-pricing.test.ts
import { describe, expect, it } from "vitest";
import {
  MODEL_PRICING,
  getPricingForModel,
  calculateSimpleCost,
} from "@/gateways/managed-agents/usage";

describe("MODEL_PRICING", () => {
  it("has entries for sonnet, haiku and opus", () => {
    expect(MODEL_PRICING["claude-sonnet-4-6"]).toBeDefined();
    expect(MODEL_PRICING["claude-haiku-4-5"]).toBeDefined();
    expect(MODEL_PRICING["claude-opus-4-6"]).toBeDefined();
  });
});

describe("getPricingForModel", () => {
  it("returns exact pricing for a known model", () => {
    const pricing = getPricingForModel("claude-haiku-4-5");
    expect(pricing.inputPerMillion).toBe(0.08);
    expect(pricing.outputPerMillion).toBe(0.40);
  });

  it("falls back to sonnet pricing for unknown model", () => {
    const pricing = getPricingForModel("unknown-model-xyz");
    expect(pricing).toEqual(MODEL_PRICING["claude-sonnet-4-6"]);
  });
});

describe("calculateSimpleCost", () => {
  it("calculates cost correctly for sonnet", () => {
    // 1M input + 1M output at sonnet prices
    const cost = calculateSimpleCost(
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      "claude-sonnet-4-6",
    );
    expect(cost).toBeCloseTo(4.80); // 0.80 + 4.00
  });

  it("calculates cost correctly for haiku", () => {
    const cost = calculateSimpleCost(
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      "claude-haiku-4-5",
    );
    expect(cost).toBeCloseTo(0.48); // 0.08 + 0.40
  });

  it("returns zero for zero tokens", () => {
    const cost = calculateSimpleCost(
      { inputTokens: 0, outputTokens: 0 },
      "claude-sonnet-4-6",
    );
    expect(cost).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
npx vitest run src/test/gateways/usage-pricing.test.ts
```
Esperado: FAIL (símbolos não existem ainda)

- [ ] **Step 3: Implementar as mudanças em `usage.ts`**

Substituir o conteúdo de `src/gateways/managed-agents/usage.ts`:

```ts
import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

// NOTE: Preços por 1M tokens — atualizar se Anthropic alterar a tabela de preços.
// Referência: https://www.anthropic.com/pricing
type ModelPricing = {
  inputPerMillion: number;
  outputPerMillion: number;
  cacheReadPerMillion: number;
  cacheCreationPerMillion: number;
};

export const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-sonnet-4-6": {
    inputPerMillion: 0.80,
    outputPerMillion: 4.00,
    cacheReadPerMillion: 0.08,
    cacheCreationPerMillion: 1.00,
  },
  "claude-haiku-4-5": {
    inputPerMillion: 0.08,
    outputPerMillion: 0.40,
    cacheReadPerMillion: 0.008,
    cacheCreationPerMillion: 0.10,
  },
  "claude-opus-4-6": {
    inputPerMillion: 15.00,
    outputPerMillion: 75.00,
    cacheReadPerMillion: 1.50,
    cacheCreationPerMillion: 18.75,
  },
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

export async function syncSessionUsage(
  anthropic: Anthropic,
  supabase: SupabaseClient,
  threadId: string,
  sessionId: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await (anthropic.beta.sessions as any).retrieve(sessionId);

  const usage = (session.usage ?? {}) as Record<string, number>;
  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
  const cacheCreationTokens = usage.cache_creation_input_tokens ?? 0;

  const pricing = getPricingForModel("claude-sonnet-4-6");
  const estimatedCostUsd =
    (inputTokens / 1_000_000) * pricing.inputPerMillion +
    (outputTokens / 1_000_000) * pricing.outputPerMillion +
    (cacheReadTokens / 1_000_000) * pricing.cacheReadPerMillion +
    (cacheCreationTokens / 1_000_000) * pricing.cacheCreationPerMillion;

  await supabase
    .from("consultant_threads")
    .update({
      total_input_tokens: inputTokens,
      total_output_tokens: outputTokens,
      total_cache_read_tokens: cacheReadTokens,
      total_cache_creation_tokens: cacheCreationTokens,
      estimated_cost_usd: estimatedCostUsd,
      last_usage_sync_at: new Date().toISOString(),
    })
    .eq("id", threadId);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run src/test/gateways/usage-pricing.test.ts
```
Esperado: PASS (3 describe blocks, todos green)

- [ ] **Step 5: Rodar todos os testes para checar regressão**

```bash
npm test
```
Esperado: todos passando (nenhum consumidor usa `CLAUDE_PRICING` diretamente — a remoção é segura)

- [ ] **Step 6: Commit**

```bash
git add src/gateways/managed-agents/usage.ts src/test/gateways/usage-pricing.test.ts
git commit -m "feat(usage): add MODEL_PRICING map and calculateSimpleCost, remove CLAUDE_PRICING"
```

---

## Task 3: Gateway de persistência `exam_usage`

**Files:**
- Create: `src/gateways/exam-usage/persist.ts`
- Create: `src/test/gateways/exam-usage-persist.test.ts`

- [ ] **Step 1: Escrever o teste com falha**

```ts
// src/test/gateways/exam-usage-persist.test.ts
import { describe, expect, it, vi } from "vitest";
import { persistExamUsage } from "@/gateways/exam-usage/persist";

function makeSupabase(upsertFn = vi.fn().mockResolvedValue({ error: null })) {
  return {
    from: vi.fn().mockReturnValue({
      upsert: upsertFn,
    }),
  } as never;
}

describe("persistExamUsage", () => {
  it("calls upsert on exam_usage with the correct payload", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeSupabase(upsert);

    await persistExamUsage(supabase, {
      examId: "exam-1",
      stage: "extraction",
      modelId: "claude-sonnet-4-6",
      inputTokens: 1000,
      outputTokens: 500,
      estimatedCostUsd: 0.002,
    });

    expect(supabase.from).toHaveBeenCalledWith("exam_usage");
    expect(upsert).toHaveBeenCalledWith(
      {
        exam_id: "exam-1",
        stage: "extraction",
        model_id: "claude-sonnet-4-6",
        input_tokens: 1000,
        output_tokens: 500,
        estimated_cost_usd: 0.002,
      },
      { onConflict: "exam_id,stage" },
    );
  });

  it("works for the adaptation stage", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeSupabase(upsert);

    await persistExamUsage(supabase, {
      examId: "exam-2",
      stage: "adaptation",
      modelId: "claude-haiku-4-5",
      inputTokens: 5000,
      outputTokens: 2000,
      estimatedCostUsd: 0.0012,
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "adaptation", exam_id: "exam-2" }),
      { onConflict: "exam_id,stage" },
    );
  });
});
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
npx vitest run src/test/gateways/exam-usage-persist.test.ts
```
Esperado: FAIL (módulo não encontrado)

- [ ] **Step 3: Criar o gateway**

```ts
// src/gateways/exam-usage/persist.ts
import type { SupabaseClient } from "@supabase/supabase-js";

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

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run src/test/gateways/exam-usage-persist.test.ts
```
Esperado: PASS

- [ ] **Step 5: Commit**

```bash
git add src/gateways/exam-usage/persist.ts src/test/gateways/exam-usage-persist.test.ts
git commit -m "feat(gateway): add persistExamUsage for exam_usage upsert"
```

---

## Task 4: Extraction runner retorna `usage`

**Files:**
- Modify: `src/mastra/agents/extraction-agent-runner.ts`
- Modify: `src/test/mastra/extraction-agent-runner.test.ts`

- [ ] **Step 1: Adicionar test de uso no arquivo existente**

Abrir `src/test/mastra/extraction-agent-runner.test.ts`. O teste existente usa `extractionGenerate.mockResolvedValueOnce({ object: { questions: [...] } })` — sem `usage`. Adicionar dois novos testes ao `describe`:

```ts
it("returns usage tokens from the agent response", async () => {
  const { runPdfExtractionAgent } = await import("@/mastra/agents/extraction-agent-runner");

  extractionGenerate.mockResolvedValueOnce({
    object: {
      questions: [
        {
          orderNum: 1,
          content: "Questão",
          questionType: "objective",
          alternatives: [{ label: "A", text: "Sim" }],
          visualElements: null,
          extractionWarning: null,
        },
      ],
    },
    usage: { promptTokens: 800, completionTokens: 200 },
  });

  const result = await runPdfExtractionAgent({
    prompt: "Extraia as questões.",
    model: {
      id: "model-1",
      name: "Sonnet",
      provider: "anthropic",
      modelId: "claude-sonnet-4-6",
      baseUrl: "https://api.anthropic.com",
      apiKey: "secret",
      enabled: true,
      isDefault: true,
    },
    pdfData: new Uint8Array([1, 2, 3]),
    contentType: "application/pdf",
  });

  expect(result.usage).toEqual({ inputTokens: 800, outputTokens: 200 });
});

it("defaults usage to zero when response.usage is undefined", async () => {
  const { runPdfExtractionAgent } = await import("@/mastra/agents/extraction-agent-runner");

  extractionGenerate.mockResolvedValueOnce({
    object: {
      questions: [
        {
          orderNum: 1,
          content: "Questão",
          questionType: "objective",
          alternatives: [{ label: "A", text: "Sim" }],
          visualElements: null,
          extractionWarning: null,
        },
      ],
    },
    // usage ausente
  });

  const result = await runPdfExtractionAgent({
    prompt: "Extraia as questões.",
    model: {
      id: "model-1",
      name: "Sonnet",
      provider: "anthropic",
      modelId: "claude-sonnet-4-6",
      baseUrl: "https://api.anthropic.com",
      apiKey: "secret",
      enabled: true,
      isDefault: true,
    },
    pdfData: new Uint8Array([1, 2, 3]),
    contentType: "application/pdf",
  });

  expect(result.usage).toEqual({ inputTokens: 0, outputTokens: 0 });
});
```

Também atualizar o teste existente para incluir `usage` no mock (para que o teste continue passando após a mudança de contrato):

No mock `extractionGenerate.mockResolvedValueOnce` do primeiro teste, adicionar `usage: { promptTokens: 0, completionTokens: 0 }`.

- [ ] **Step 2: Rodar para confirmar falha nos novos testes**

```bash
npx vitest run src/test/mastra/extraction-agent-runner.test.ts
```
Esperado: 2 testes novos FAILing, 1 existente PASSING

- [ ] **Step 3: Implementar a mudança no runner**

Abrir `src/mastra/agents/extraction-agent-runner.ts`. Alterar o `return` ao final de `runPdfExtractionAgent`:

```ts
// Antes:
return extractionOutputSchema.parse(response.object);

// Depois:
const rawUsage = response.usage ?? { promptTokens: 0, completionTokens: 0 };
return {
  ...extractionOutputSchema.parse(response.object),
  usage: {
    inputTokens: rawUsage.promptTokens,
    outputTokens: rawUsage.completionTokens,
  },
};
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run src/test/mastra/extraction-agent-runner.test.ts
```
Esperado: todos PASS

- [ ] **Step 5: Commit**

```bash
git add src/mastra/agents/extraction-agent-runner.ts src/test/mastra/extraction-agent-runner.test.ts
git commit -m "feat(runner): extraction agent runner returns usage tokens"
```

---

## Task 5: Analysis runners retornam `usage`

**Files:**
- Modify: `src/mastra/agents/analysis-agent-runners.ts`
- Modify: `src/test/mastra/analysis-agent-runners.test.ts`

- [ ] **Step 1: Adicionar testes de `usage` no arquivo existente**

Abrir `src/test/mastra/analysis-agent-runners.test.ts`. Adicionar `usage` aos mocks existentes e novas assertions. Também atualizar os mocks dos testes existentes para incluir `usage` (para que continuem passando após a mudança de contrato):

Para o teste BNCC existente, atualizar o mock:
```ts
bnccGenerate.mockResolvedValueOnce({
  object: { skills: [" EF07MA01 ", "EF07MA02"], analysis: "..." },
  usage: { promptTokens: 0, completionTokens: 0 },
});
```

Para o teste Bloom existente:
```ts
bloomGenerate.mockResolvedValueOnce({
  object: { level: "Aplicar", analysis: "..." },
  usage: { promptTokens: 0, completionTokens: 0 },
});
```

Para os testes de adaptação existentes (objective, reduced, error cases):
```ts
adaptationGenerate.mockResolvedValueOnce({
  object: { ... },
  usage: { promptTokens: 0, completionTokens: 0 },
});
```

Adicionar novos testes:

```ts
it("BNCC runner returns usage tokens", async () => {
  const { runBnccAnalysisAgent } = await import("@/mastra/agents/analysis-agent-runners");

  bnccGenerate.mockResolvedValueOnce({
    object: { skills: ["EF07MA01"], analysis: "Análise." },
    usage: { promptTokens: 600, completionTokens: 150 },
  });

  const result = await runBnccAnalysisAgent({ prompt: "Analise.", model: {} as never });

  expect(result.usage).toEqual({ inputTokens: 600, outputTokens: 150 });
});

it("Bloom runner returns usage tokens", async () => {
  const { runBloomAnalysisAgent } = await import("@/mastra/agents/analysis-agent-runners");

  bloomGenerate.mockResolvedValueOnce({
    object: { level: "Lembrar", analysis: "Análise." },
    usage: { promptTokens: 400, completionTokens: 100 },
  });

  const result = await runBloomAnalysisAgent({ prompt: "Analise.", model: {} as never });

  expect(result.usage).toEqual({ inputTokens: 400, outputTokens: 100 });
});

it("adaptation runner returns usage tokens for essay branch", async () => {
  const { runAdaptationAgent } = await import("@/mastra/agents/analysis-agent-runners");

  adaptationGenerate.mockResolvedValueOnce({
    object: { adaptedContent: "Questão adaptada." },
    usage: { promptTokens: 300, completionTokens: 80 },
  });

  const result = await runAdaptationAgent({
    prompt: "Adapte.",
    instructions: "Simplifique.",
    model: {} as never,
    alternatives: null,
    correctAnswer: null,
  });

  expect(result.usage).toEqual({ inputTokens: 300, outputTokens: 80 });
});

it("adaptation runner defaults usage to zero when undefined", async () => {
  const { runAdaptationAgent } = await import("@/mastra/agents/analysis-agent-runners");

  adaptationGenerate.mockResolvedValueOnce({
    object: { adaptedContent: "Questão adaptada." },
    // usage ausente
  });

  const result = await runAdaptationAgent({
    prompt: "Adapte.",
    instructions: "Simplifique.",
    model: {} as never,
    alternatives: null,
    correctAnswer: null,
  });

  expect(result.usage).toEqual({ inputTokens: 0, outputTokens: 0 });
});
```

- [ ] **Step 2: Rodar para confirmar falha nos novos testes**

```bash
npx vitest run src/test/mastra/analysis-agent-runners.test.ts
```
Esperado: novos FAILing, existentes PASSING

- [ ] **Step 3: Implementar as mudanças nos runners**

Abrir `src/mastra/agents/analysis-agent-runners.ts`. Para cada função:

**`runBnccAnalysisAgent`** — alterar o `return`:
```ts
const rawUsage = response.usage ?? { promptTokens: 0, completionTokens: 0 };
return {
  skills: result.skills.map((skill) => skill.trim()).filter(Boolean),
  analysis: result.analysis.trim(),
  usage: { inputTokens: rawUsage.promptTokens, outputTokens: rawUsage.completionTokens },
};
```

**`runBloomAnalysisAgent`** — alterar o `return`:
```ts
const rawUsage = response.usage ?? { promptTokens: 0, completionTokens: 0 };
return {
  level: result.level,
  analysis: result.analysis.trim(),
  usage: { inputTokens: rawUsage.promptTokens, outputTokens: rawUsage.completionTokens },
};
```

**`runAdaptationAgent`** — há dois `response` (essay e objective), cada branch precisa capturar seu próprio `response.usage`:

No branch essay:
```ts
const rawUsage = response.usage ?? { promptTokens: 0, completionTokens: 0 };
return {
  adaptedContent: result.adaptedContent.trim(),
  adaptedAlternatives: null,
  usage: { inputTokens: rawUsage.promptTokens, outputTokens: rawUsage.completionTokens },
};
```

No branch objective:
```ts
const rawUsage = response.usage ?? { promptTokens: 0, completionTokens: 0 };
return {
  adaptedContent: result.adaptedStatement.trim(),
  adaptedAlternatives: mapAdaptedAlternatives(...),
  usage: { inputTokens: rawUsage.promptTokens, outputTokens: rawUsage.completionTokens },
};
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run src/test/mastra/analysis-agent-runners.test.ts
```
Esperado: todos PASS

- [ ] **Step 5: Commit**

```bash
git add src/mastra/agents/analysis-agent-runners.ts src/test/mastra/analysis-agent-runners.test.ts
git commit -m "feat(runner): analysis agent runners return usage tokens"
```

---

## Task 6: Extract exam workflow — acumular e persistir usage

**Files:**
- Modify: `src/mastra/workflows/extract-exam-workflow.ts`
- Modify: `src/test/mastra/extract-exam-workflow.test.ts`

- [ ] **Step 1: Adicionar testes de `persistExamUsage` no arquivo existente**

Abrir `src/test/mastra/extract-exam-workflow.test.ts`. Atualizar o mock `runExtractionAgent` do primeiro teste para incluir `usage`:

```ts
runExtractionAgent: vi.fn().mockResolvedValue({
  questions: [...],
  usage: { inputTokens: 1200, outputTokens: 300 },
}),
```

Adicionar `persistExamUsage: vi.fn().mockResolvedValue(undefined)` às deps do primeiro teste. Depois adicionar assertion:

```ts
expect(persistExamUsage).toHaveBeenCalledWith(
  expect.objectContaining({
    examId: "exam-1",
    stage: "extraction",
    inputTokens: 1200,
    outputTokens: 300,
    modelId: "gpt-5.4",
    estimatedCostUsd: expect.any(Number),
  }),
);
```

Adicionar novo teste para o caminho de erro (sem questões válidas) — `persistExamUsage` também deve ser chamado:

```ts
it("calls persistExamUsage even on the error path (no valid questions)", async () => {
  const persistExamUsage = vi.fn().mockResolvedValue(undefined);

  const workflow = createExtractExamWorkflow({
    listModels: vi.fn().mockResolvedValue([
      {
        id: "model-1",
        name: "GPT 5.4",
        provider: "openai",
        modelId: "gpt-5.4",
        baseUrl: "https://api.openai.com/v1",
        apiKey: "secret",
        enabled: true,
        isDefault: true,
      },
    ]),
    runExtractionAgent: vi.fn().mockResolvedValue({
      questions: [],
      usage: { inputTokens: 500, outputTokens: 100 },
    }),
    persistExtraction: vi.fn().mockResolvedValue({ warnings: [], questionsCount: 0 }),
    persistExamUsage,
    registerEvent: vi.fn(),
  });

  await runExtractExamWorkflow(workflow, {
    examId: "exam-err",
    initiatedBy: "teacher-1",
    pdfPath: "teacher-1/exam-err.pdf",
  });

  expect(persistExamUsage).toHaveBeenCalledWith(
    expect.objectContaining({ examId: "exam-err", stage: "extraction" }),
  );
});
```

- [ ] **Step 2: Rodar para confirmar falha nos novos testes**

```bash
npx vitest run src/test/mastra/extract-exam-workflow.test.ts
```
Esperado: novos FAILing

- [ ] **Step 3: Implementar as mudanças no workflow**

Abrir `src/mastra/workflows/extract-exam-workflow.ts`. Fazer estas mudanças:

**a) Atualizar `ExtractionWorkflowDependencies`** — o tipo de retorno de `runExtractionAgent` e adicionar `persistExamUsage`:

```ts
type ExtractionWorkflowDependencies = {
  // ...existente...
  runExtractionAgent(input: {
    prompt: string;
    pdfPath: string;
    model: AiModelRecord;
  }): Promise<{
    questions: Array<{...}>; // mesmo de antes
    usage: { inputTokens: number; outputTokens: number }; // NOVO
  }>;
  persistExamUsage?(input: { // NOVO, opcional
    examId: string;
    stage: "extraction" | "adaptation";
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  }): Promise<void>;
  // ...resto sem mudança...
};
```

**b) Adicionar `usage` ao `extractionPayloadSchema`** no nível raiz (ao lado de `metadata` e `payload`):

```ts
const extractionPayloadSchema = z.object({
  metadata: z.object({ ... }), // inalterado
  payload: z.object({ ... }),  // inalterado
  usage: z.object({            // NOVO
    inputTokens: z.number(),
    outputTokens: z.number(),
    modelId: z.string(),
  }),
});
```

**c) No `startStep.execute`** — após obter `payload`, capturar `usage`:

```ts
const payload = await dependencies.runExtractionAgent({
  prompt: buildExtractionPrompt(),
  pdfPath: inputData.pdfPath,
  model: modelRecord,
});

return {
  metadata,
  payload,
  usage: {              // NOVO
    inputTokens: payload.usage.inputTokens,
    outputTokens: payload.usage.outputTokens,
    modelId: modelRecord.modelId,
  },
};
```

**d) No `persistStep.execute`** — importar `calculateSimpleCost` e chamar `persistExamUsage` em ambos os caminhos. Adicionar chamada ANTES de cada `return`:

Caminho de erro (antes do `return` de erro):
```ts
await dependencies.persistExamUsage?.({
  examId: inputData.metadata.examId,
  stage: "extraction",
  modelId: inputData.usage.modelId,
  inputTokens: inputData.usage.inputTokens,
  outputTokens: inputData.usage.outputTokens,
  estimatedCostUsd: calculateSimpleCost(
    { inputTokens: inputData.usage.inputTokens, outputTokens: inputData.usage.outputTokens },
    inputData.usage.modelId,
  ),
});
```

Caminho de sucesso (após `persistExtractionTool.execute` e antes do `return`):
```ts
await dependencies.persistExamUsage?.({
  examId: inputData.metadata.examId,
  stage: "extraction",
  modelId: inputData.usage.modelId,
  inputTokens: inputData.usage.inputTokens,
  outputTokens: inputData.usage.outputTokens,
  estimatedCostUsd: calculateSimpleCost(
    { inputTokens: inputData.usage.inputTokens, outputTokens: inputData.usage.outputTokens },
    inputData.usage.modelId,
  ),
});
```

Adicionar o import de `calculateSimpleCost` no topo:
```ts
import { calculateSimpleCost } from "@/gateways/managed-agents/usage";
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run src/test/mastra/extract-exam-workflow.test.ts
```
Esperado: todos PASS

- [ ] **Step 5: Rodar typecheck**

```bash
npm run typecheck
```
Esperado: sem erros

- [ ] **Step 6: Commit**

```bash
git add src/mastra/workflows/extract-exam-workflow.ts src/test/mastra/extract-exam-workflow.test.ts
git commit -m "feat(workflow): extract exam workflow accumulates and persists usage"
```

---

## Task 7: Analyze-and-adapt workflow — acumular e persistir usage

**Files:**
- Modify: `src/mastra/workflows/analyze-and-adapt-workflow.ts`
- Modify: `src/test/mastra/analyze-and-adapt-workflow.test.ts`

- [ ] **Step 1: Adicionar testes no arquivo existente**

Abrir `src/test/mastra/analyze-and-adapt-workflow.test.ts`. Atualizar os mocks para retornar `usage`:

```ts
runBnccAnalysis: vi.fn().mockResolvedValue({
  skills: ["EF07MA01"],
  analysis: "A questão trabalha soma de frações.",
  usage: { inputTokens: 600, outputTokens: 150 },
}),
runBloomAnalysis: vi.fn().mockResolvedValue({
  level: "Aplicar",
  analysis: "O aluno aplica o conceito de frações.",
  usage: { inputTokens: 400, outputTokens: 100 },
}),
runAdaptation: vi.fn().mockResolvedValue({
  adaptedContent: "Quanto é metade mais um quarto?",
  adaptedAlternatives: [...],
  usage: { inputTokens: 800, outputTokens: 200 },
}),
```

Adicionar `persistExamUsage: vi.fn().mockResolvedValue(undefined)` às deps.

Adicionar assertions ao teste existente:
```ts
expect(persistExamUsage).toHaveBeenCalledWith(
  expect.objectContaining({
    examId: "exam-1",
    stage: "adaptation",
    // 600+400+800 = 1800 input, 150+100+200 = 450 output
    inputTokens: 1800,
    outputTokens: 450,
    estimatedCostUsd: expect.any(Number),
  }),
);
```

Adicionar novo teste de que `persistExamUsage` é chamado mesmo no erro:

```ts
it("calls persistExamUsage even when adaptation fails", async () => {
  const persistExamUsage = vi.fn().mockResolvedValue(undefined);

  const workflow = createAnalyzeAndAdaptWorkflow({
    loadExamContext: vi.fn().mockResolvedValue(examContext),
    createPendingAdaptations: vi.fn().mockResolvedValue(undefined),
    persistAdaptation: vi.fn().mockResolvedValue(undefined),
    updateExamStatus: vi.fn().mockResolvedValue(undefined),
    runBnccAnalysis: vi.fn().mockRejectedValue(new Error("BNCC falhou")),
    runBloomAnalysis: vi.fn().mockResolvedValue({ level: "Lembrar", analysis: ".", usage: { inputTokens: 0, outputTokens: 0 } }),
    runAdaptation: vi.fn().mockResolvedValue({ adaptedContent: ".", adaptedAlternatives: null, usage: { inputTokens: 0, outputTokens: 0 } }),
    persistExamUsage,
    registerEvent: vi.fn(),
  });

  await runAnalyzeAndAdaptWorkflow(workflow, { examId: "exam-fail" });

  expect(persistExamUsage).toHaveBeenCalledWith(
    expect.objectContaining({ examId: "exam-fail", stage: "adaptation" }),
  );
});
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
npx vitest run src/test/mastra/analyze-and-adapt-workflow.test.ts
```
Esperado: novos FAILing

- [ ] **Step 3: Implementar as mudanças no workflow**

Abrir `src/mastra/workflows/analyze-and-adapt-workflow.ts`.

**a) Adicionar import:**
```ts
import { calculateSimpleCost } from "@/gateways/managed-agents/usage";
```

**b) Atualizar `AnalyzeAndAdaptDependencies`** — os tipos de retorno e `persistExamUsage`:

```ts
type AnalyzeAndAdaptDependencies = {
  // ...existente...
  runBnccAnalysis(input: { prompt: string; model: AiModelRecord }): Promise<AnalysisResult & { usage: { inputTokens: number; outputTokens: number } }>;
  runBloomAnalysis(input: { prompt: string; model: AiModelRecord }): Promise<BloomResult & { usage: { inputTokens: number; outputTokens: number } }>;
  runAdaptation(input: { ... }): Promise<AdaptationAgentResult & { usage: { inputTokens: number; outputTokens: number } }>;
  persistExamUsage?(input: { // NOVO, opcional
    examId: string;
    stage: "extraction" | "adaptation";
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  }): Promise<void>;
};
```

**c) No `executeStep.execute`** — inicializar contadores ANTES do `try` (para que fiquem acessíveis no bloco `catch`) e acumular dentro do loop:

Localizar as linhas `let processedQuestions = 0;` e `let processedAdaptations = 0;` — ambas estão **antes** do `try`. Adicionar as duas novas variáveis logo abaixo delas, também antes do `try`:
```ts
let processedQuestions = 0;
let processedAdaptations = 0;
let totalInputTokens = 0;  // NOVO
let totalOutputTokens = 0; // NOVO

try {
  // ... loop existente ...
}
```

Após cada chamada que retorna `usage`, acumular:
```ts
const bncc = await dependencies.runBnccAnalysis({...});
totalInputTokens += bncc.usage.inputTokens;
totalOutputTokens += bncc.usage.outputTokens;

const bloom = await dependencies.runBloomAnalysis({...});
totalInputTokens += bloom.usage.inputTokens;
totalOutputTokens += bloom.usage.outputTokens;

// dentro do loop de supports:
const adaptation = await dependencies.runAdaptation({...});
totalInputTokens += adaptation.usage.inputTokens;
totalOutputTokens += adaptation.usage.outputTokens;
```

Antes do `return` de sucesso (após `updateExamStatus`):
```ts
const sharedModelId = inputData.context.supports[0].model.modelId;
await dependencies.persistExamUsage?.({
  examId: inputData.context.exam.id,
  stage: "adaptation",
  modelId: sharedModelId,
  inputTokens: totalInputTokens,
  outputTokens: totalOutputTokens,
  estimatedCostUsd: calculateSimpleCost(
    { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
    sharedModelId,
  ),
});
```

No bloco `catch`, antes do `return` de erro (após `updateExamStatus`):
```ts
const sharedModelId = inputData.context.supports[0]?.model.modelId ?? "claude-sonnet-4-6";
await dependencies.persistExamUsage?.({
  examId: inputData.context.exam.id,
  stage: "adaptation",
  modelId: sharedModelId,
  inputTokens: totalInputTokens,
  outputTokens: totalOutputTokens,
  estimatedCostUsd: calculateSimpleCost(
    { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
    sharedModelId,
  ),
});
```


- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run src/test/mastra/analyze-and-adapt-workflow.test.ts
```
Esperado: todos PASS

- [ ] **Step 5: Rodar typecheck**

```bash
npm run typecheck
```
Esperado: sem erros

- [ ] **Step 6: Commit**

```bash
git add src/mastra/workflows/analyze-and-adapt-workflow.ts src/test/mastra/analyze-and-adapt-workflow.test.ts
git commit -m "feat(workflow): adapt workflow accumulates and persists usage tokens"
```

---

## Task 8: Services injetam `persistExamUsage`

**Files:**
- Modify: `src/services/ai/run-extraction.ts`
- Modify: `src/services/ai/run-analysis-and-adaptation.ts`
- Modify: `src/test/services/run-extraction.test.ts`
- Modify: `src/test/services/run-analysis-and-adaptation.test.ts`

- [ ] **Step 1: Atualizar testes de run-extraction**

Abrir `src/test/services/run-extraction.test.ts`. A função `runExtraction` passará a aceitar `supabase?: SupabaseClient` como 3º argumento e criará o wrapper de `persistExamUsage` internamente. Os testes **não passam `persistExamUsage` nas deps** — passam um supabase mockado (ou omitem).

Atualizar os mocks dos testes existentes para incluir `usage` no `runExtractionAgent`:

```ts
runExtractionAgent: vi.fn().mockResolvedValue({
  questions: [...existente...],
  usage: { inputTokens: 100, outputTokens: 50 },
}),
```

Adicionar novo teste de resiliência — passa um `supabase` cujo `upsert` rejeita e verifica que o serviço não estoura:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

it("does not throw when exam_usage upsert fails", async () => {
  const failingSupabase = {
    from: () => ({
      upsert: () => Promise.reject(new Error("DB error")),
    }),
  } as unknown as SupabaseClient;

  await expect(
    runExtraction(
      { examId: "exam-1", initiatedBy: "teacher-1", pdfPath: "teacher-1/exam-1.pdf" },
      {
        listModels: vi.fn().mockResolvedValue([defaultModel]),
        runExtractionAgent: vi.fn().mockResolvedValue({
          questions: [
            {
              orderNum: 1,
              content: "Quanto é 2 + 2?",
              questionType: "objective",
              alternatives: [{ label: "A", text: "4" }],
              visualElements: null,
              extractionWarning: null,
            },
          ],
          usage: { inputTokens: 100, outputTokens: 50 },
        }),
        persistExtraction: vi.fn().mockResolvedValue({ warnings: [], questionsCount: 1 }),
        registerEvent: vi.fn(),
      },
      failingSupabase, // 3º argumento: supabase que vai falhar
    ),
  ).resolves.toEqual(
    expect.objectContaining({ outcome: "success" }),
  );
});
```

- [ ] **Step 2: Atualizar testes de run-analysis-and-adaptation**

Abrir `src/test/services/run-analysis-and-adaptation.test.ts`. Atualizar os mocks das funções existentes para incluir `usage`:

```ts
runBnccAnalysis: vi.fn().mockResolvedValue({
  skills: ["EF07MA01"],
  analysis: "A questão trabalha soma de frações.",
  usage: { inputTokens: 600, outputTokens: 150 },
}),
runBloomAnalysis: vi.fn().mockResolvedValue({
  level: "Aplicar",
  analysis: "O aluno aplica o conceito de frações.",
  usage: { inputTokens: 400, outputTokens: 100 },
}),
runAdaptation: vi.fn().mockResolvedValue({
  adaptedContent: "Quanto é metade mais um quarto?",
  adaptedAlternatives: null,
  usage: { inputTokens: 800, outputTokens: 200 },
}),
```

Adicionar teste de resiliência:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

it("does not throw when exam_usage upsert fails", async () => {
  const failingSupabase = {
    from: () => ({
      upsert: () => Promise.reject(new Error("DB error")),
    }),
  } as unknown as SupabaseClient;

  await expect(
    runAnalysisAndAdaptation(
      { examId: "exam-1" },
      {
        loadExamContext: vi.fn().mockResolvedValue(examContext),
        createPendingAdaptations: vi.fn().mockResolvedValue(undefined),
        persistAdaptation: vi.fn().mockResolvedValue(undefined),
        updateExamStatus: vi.fn().mockResolvedValue(undefined),
        runBnccAnalysis: vi.fn().mockResolvedValue({
          skills: ["EF07MA01"],
          analysis: ".",
          usage: { inputTokens: 100, outputTokens: 50 },
        }),
        runBloomAnalysis: vi.fn().mockResolvedValue({
          level: "Aplicar",
          analysis: ".",
          usage: { inputTokens: 100, outputTokens: 50 },
        }),
        runAdaptation: vi.fn().mockResolvedValue({
          adaptedContent: "Adaptado.",
          adaptedAlternatives: null,
          usage: { inputTokens: 100, outputTokens: 50 },
        }),
        registerEvent: vi.fn(),
      },
      failingSupabase, // 3º argumento
    ),
  ).resolves.toEqual(
    expect.objectContaining({ outcome: "success" }),
  );
});
```

- [ ] **Step 3: Rodar para confirmar falha nos novos testes**

```bash
npx vitest run src/test/services/run-extraction.test.ts src/test/services/run-analysis-and-adaptation.test.ts
```

- [ ] **Step 4: Implementar em `run-extraction.ts`**

Modificar `runExtraction` para aceitar `supabase?: SupabaseClient` como 3º argumento. O serviço cria o wrapper de `persistExamUsage` internamente com try/catch, encapsulando a chamada ao gateway. O tipo `RunExtractionDependencies` deixa de incluir `persistExamUsage` na assinatura pública (o serviço remove essa responsabilidade do caller).

```ts
// src/services/ai/run-extraction.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type ExtractionWorkflowInput,
  type ExtractionWorkflowResult,
} from "@/mastra/contracts/extraction-contracts";
import {
  createExtractExamWorkflow,
  runExtractExamWorkflow,
} from "@/mastra/workflows/extract-exam-workflow";
import { createPrismaMastraRuntime } from "@/mastra/runtime";
import { persistExamUsage as persistExamUsageGateway } from "@/gateways/exam-usage/persist";

// Deps sem persistExamUsage — o serviço injeta esse internamente
type RunExtractionDeps = Omit<
  Parameters<typeof createExtractExamWorkflow>[0],
  "persistExamUsage"
>;

export async function runExtraction(
  input: ExtractionWorkflowInput,
  dependencies: RunExtractionDeps,
  supabase?: SupabaseClient,
): Promise<ExtractionWorkflowResult> {
  const persistFn = supabase
    ? async (usageInput: Parameters<typeof persistExamUsageGateway>[1]) => {
        try {
          await persistExamUsageGateway(supabase, usageInput);
        } catch (err) {
          console.error("[exam-usage] Failed to persist extraction usage:", err);
        }
      }
    : undefined;

  const workflow = createExtractExamWorkflow({
    ...dependencies,
    persistExamUsage: persistFn,
  });
  const mastra = createPrismaMastraRuntime({ extractExamWorkflow: workflow });
  const registeredWorkflow = mastra.getWorkflowById(workflow.id) as typeof workflow;
  const result = await runExtractExamWorkflow(registeredWorkflow, input);

  if (result.status !== "success") {
    throw new Error("Falha ao executar o workflow de extração.");
  }

  return result.result as ExtractionWorkflowResult;
}
```

Abrir `src/app/api/exams/route.ts` — adicionar `supabase` ao call de `runExtraction` (o `supabase` já está disponível no contexto do route handler).

- [ ] **Step 5: Implementar em `run-analysis-and-adaptation.ts`**

Mesma abordagem — adicionar `supabase?: SupabaseClient` como 3º argumento. A estrutura é idêntica à de `run-extraction.ts`: criar o wrapper com try/catch internamente e remover `persistExamUsage` do tipo público de deps.

Abrir `src/app/api/exams/[id]/answers/route.ts` — adicionar `supabase` ao call de `runAnalysisAndAdaptation`.

- [ ] **Step 6: Atualizar os route handlers**

Abrir `src/app/api/exams/route.ts` — passar `supabase` para `runExtraction`.
Abrir `src/app/api/exams/[id]/answers/route.ts` — passar `supabase` para `runAnalysisAndAdaptation`.

- [ ] **Step 7: Rodar e confirmar que passa**

```bash
npx vitest run src/test/services/run-extraction.test.ts src/test/services/run-analysis-and-adaptation.test.ts
```
Esperado: todos PASS

- [ ] **Step 8: Rodar typecheck**

```bash
npm run typecheck
```

- [ ] **Step 9: Rodar todos os testes**

```bash
npm test
```

- [ ] **Step 10: Commit**

```bash
git add src/services/ai/run-extraction.ts src/services/ai/run-analysis-and-adaptation.ts \
  src/app/api/exams/route.ts src/app/api/exams/[id]/answers/route.ts \
  src/test/services/run-extraction.test.ts src/test/services/run-analysis-and-adaptation.test.ts
git commit -m "feat(service): inject persistExamUsage into extraction and adaptation services"
```

---

## Task 9: Atualizar contracts do admin

**Files:**
- Modify: `src/features/admin/usage/contracts.ts`

- [ ] **Step 1: Atualizar o arquivo de contracts**

```ts
// src/features/admin/usage/contracts.ts

export type AdminUsageUser = {
  userId: string;
  name: string | null;
  email: string | null;
  threadCount: number;
  examCount: number;
  costByCategory: {
    consultant: number;
    extraction: number;
    adaptation: number;
  };
  estimatedCostUSD: number;
  lastActivityAt: string | null;
};

export type AdminUsageThread = {
  threadId: string;
  title: string | null;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  estimatedCostUSD: number;
  updatedAt: string;
};

export type AdminUsageExam = {
  examId: string;
  topic: string | null;
  status: string;
  extractionCostUSD: number;
  adaptationCostUSD: number;
  totalCostUSD: number;
  createdAt: string;
};

export type AdminUsageTotals = {
  sessions: number;
  examCount: number;
  estimatedCostUSD: number;
};

export type AdminUsageSummary = {
  totals: AdminUsageTotals;
  users: AdminUsageUser[];
};

export type AdminUsageUserDetail = {
  user: { name: string | null; email: string | null };
  threads: AdminUsageThread[];
  exams: AdminUsageExam[];
};
```

- [ ] **Step 2: Rodar typecheck para ver os erros nos consumidores**

```bash
npm run typecheck
```
Esperado: erros de tipo **nos arquivos consumidores** (`usage-users-table.tsx`, `page.tsx`, `route.ts`) que ainda usam os campos antigos — esses erros são esperados e serão corrigidos nas Tasks 10 e 11. O arquivo `contracts.ts` em si compilará sem erros. Se houver erros fora desses arquivos, investigar antes de continuar.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/usage/contracts.ts
git commit -m "feat(contracts): expand AdminUsageUser and AdminUsageTotals with exam breakdown types"
```

---

## Task 10: Admin data loading — páginas e API routes

**Files:**
- Modify: `src/app/(admin)/usage/page.tsx`
- Modify: `src/app/(admin)/usage/[userId]/page.tsx`
- Modify: `src/app/api/admin/usage/route.ts`
- Modify: `src/app/api/admin/usage/[userId]/route.ts`

- [ ] **Step 1: Atualizar `src/app/(admin)/usage/page.tsx`**

Substituir `loadUsageSummary` para executar dois queries em paralelo e combinar. O select de `exam_usage` inclui `exam_id` para contar exames únicos:

```ts
async function loadUsageSummary(): Promise<AdminUsageSummary> {
  const supabase = await createClient();

  const [threadsResult, examUsageResult] = await Promise.all([
    supabase
      .from("consultant_threads")
      .select("teacher_id, estimated_cost_usd, updated_at, profiles(full_name, email)")
      .not("managed_session_id", "is", null),
    supabase
      .from("exam_usage")
      .select("exam_id, stage, estimated_cost_usd, created_at, exams!inner(user_id)"),
  ]);

  const threads = threadsResult.data ?? [];
  const examUsages = examUsageResult.data ?? [];

  const userMap = new Map<string, AdminUsageUser>();
  // examsByUser: userId → Set<examId> para contar exames únicos por usuário
  const examsByUser = new Map<string, Set<string>>();

  // Agregar threads
  for (const thread of threads) {
    const profile = thread.profiles as unknown as { full_name: string | null; email: string | null } | null;
    const cost = (thread.estimated_cost_usd as number) ?? 0;
    const updatedAt = thread.updated_at as string;
    const userId = thread.teacher_id;

    if (!userMap.has(userId)) {
      userMap.set(userId, {
        userId,
        name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        threadCount: 0,
        examCount: 0,
        costByCategory: { consultant: 0, extraction: 0, adaptation: 0 },
        estimatedCostUSD: 0,
        lastActivityAt: null,
      });
    }

    const user = userMap.get(userId)!;
    user.threadCount++;
    user.costByCategory.consultant += cost;
    user.estimatedCostUSD += cost;
    if (!user.lastActivityAt || updatedAt > user.lastActivityAt) {
      user.lastActivityAt = updatedAt;
    }
  }

  // Agregar exam_usage
  for (const eu of examUsages) {
    const exam = eu.exams as unknown as { user_id: string } | null;
    if (!exam?.user_id) continue;

    const userId = exam.user_id;
    const examId = eu.exam_id as string;
    const cost = (eu.estimated_cost_usd as number) ?? 0;
    const createdAt = eu.created_at as string;
    const stage = eu.stage as "extraction" | "adaptation";

    if (!userMap.has(userId)) {
      userMap.set(userId, {
        userId,
        name: null,
        email: null,
        threadCount: 0,
        examCount: 0,
        costByCategory: { consultant: 0, extraction: 0, adaptation: 0 },
        estimatedCostUSD: 0,
        lastActivityAt: null,
      });
    }
    if (!examsByUser.has(userId)) examsByUser.set(userId, new Set());

    const user = userMap.get(userId)!;
    user.costByCategory[stage] += cost;
    user.estimatedCostUSD += cost;
    examsByUser.get(userId)!.add(examId);
    if (!user.lastActivityAt || createdAt > user.lastActivityAt) {
      user.lastActivityAt = createdAt;
    }
  }

  // Preencher examCount por usuário
  for (const [userId, examIds] of examsByUser) {
    const user = userMap.get(userId);
    if (user) user.examCount = examIds.size;
  }

  const users = [...userMap.values()].sort((a, b) => b.estimatedCostUSD - a.estimatedCostUSD);

  // Contar exames únicos no total
  const uniqueExamIds = new Set(examUsages.map((eu) => eu.exam_id as string));

  return {
    totals: {
      sessions: threads.length,
      examCount: uniqueExamIds.size,
      estimatedCostUSD: users.reduce((s, u) => s + u.estimatedCostUSD, 0),
    },
    users,
  };
}
```

Atualizar o JSX para exibir os novos totais (trocar "Total de sessões" por "Sessões / Provas" ou dois cards):
```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
  <div className="rounded-2xl border border-border-default bg-white p-5">
    <p className="text-sm text-text-secondary">Total de sessões</p>
    <p className="mt-1 text-2xl font-semibold text-text-primary">
      {summary.totals.sessions.toLocaleString("pt-BR")}
    </p>
  </div>
  <div className="rounded-2xl border border-border-default bg-white p-5">
    <p className="text-sm text-text-secondary">Total de provas</p>
    <p className="mt-1 text-2xl font-semibold text-text-primary">
      {summary.totals.examCount.toLocaleString("pt-BR")}
    </p>
  </div>
  <div className="rounded-2xl border border-border-default bg-white p-5">
    <p className="text-sm text-text-secondary">Custo estimado total</p>
    <p className="mt-1 font-mono text-2xl font-semibold text-text-primary">
      ${summary.totals.estimatedCostUSD.toFixed(4)} USD
    </p>
  </div>
</div>
```

- [ ] **Step 2: Atualizar `src/app/(admin)/usage/[userId]/page.tsx`**

Adicionar query de `exam_usage` em `loadUserUsage`:

```ts
const [profileResult, threadsResult, examUsageResult] = await Promise.all([
  supabase.from("profiles").select("full_name, email").eq("id", userId).single(),
  supabase
    .from("consultant_threads")
    .select("id, title, total_input_tokens, total_output_tokens, total_cache_read_tokens, total_cache_creation_tokens, estimated_cost_usd, updated_at")
    .eq("teacher_id", userId)
    .not("managed_session_id", "is", null)
    .order("updated_at", { ascending: false }),
  supabase
    .from("exam_usage")
    .select("exam_id, stage, estimated_cost_usd, created_at, exams(topic, status, user_id)")
    .eq("exams.user_id", userId),
]);
```

Agregar exam_usage por exam_id:
```ts
const examMap = new Map<string, AdminUsageExam>();
for (const eu of (examUsageResult.data ?? [])) {
  const exam = eu.exams as unknown as { topic: string | null; status: string; user_id: string } | null;
  if (!exam || exam.user_id !== userId) continue;

  if (!examMap.has(eu.exam_id)) {
    examMap.set(eu.exam_id, {
      examId: eu.exam_id,
      topic: exam.topic,
      status: exam.status,
      extractionCostUSD: 0,
      adaptationCostUSD: 0,
      totalCostUSD: 0,
      createdAt: eu.created_at as string,
    });
  }

  const e = examMap.get(eu.exam_id)!;
  const cost = (eu.estimated_cost_usd as number) ?? 0;
  if (eu.stage === "extraction") e.extractionCostUSD += cost;
  if (eu.stage === "adaptation") e.adaptationCostUSD += cost;
  e.totalCostUSD += cost;
}

const exams = [...examMap.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
```

Passar `exams` para o JSX e renderizar a nova `UsageExamsTable`.

**Nota:** O filtro `.eq("exams.user_id", userId)` pode não funcionar diretamente no Supabase JS (filtros em joins relacionais). Uma alternativa mais confiável:
```ts
supabase
  .from("exam_usage")
  .select("exam_id, stage, estimated_cost_usd, created_at, exams!inner(topic, status, user_id)")
  .eq("exams.user_id", userId)
```
Usar `!inner` para forçar o join e filtrar pelo user_id. Testar na página.

- [ ] **Step 3: Atualizar `src/app/api/admin/usage/route.ts`**

Aplicar a mesma lógica de agregação que foi feita no `page.tsx` (ambos fazem a mesma coisa — manter em sincronia).

- [ ] **Step 4: Atualizar `src/app/api/admin/usage/[userId]/route.ts`**

Aplicar a mesma lógica do `[userId]/page.tsx`.

- [ ] **Step 5: Rodar typecheck**

```bash
npm run typecheck
```
Esperado: sem erros

- [ ] **Step 6: Commit**

```bash
git add src/app/\(admin\)/usage/page.tsx src/app/\(admin\)/usage/\[userId\]/page.tsx \
  src/app/api/admin/usage/route.ts src/app/api/admin/usage/\[userId\]/route.ts
git commit -m "feat(admin): load exam_usage in usage pages and API routes"
```

---

## Task 11: Admin UI — tabelas com breakdown

**Files:**
- Modify: `src/features/admin/usage/components/usage-users-table.tsx`
- Create: `src/features/admin/usage/components/usage-exams-table.tsx`
- Modify: `src/app/(admin)/usage/[userId]/page.tsx`

- [ ] **Step 1: Atualizar `usage-users-table.tsx`**

Adicionar coluna de breakdown e `examCount` à tabela existente:

```tsx
// Adicionar coluna no <thead>:
<th align="right">Provas</th>
<th align="right">Consultant (USD)</th>
<th align="right">Extração (USD)</th>
<th align="right">Adaptação (USD)</th>
// Remover a coluna simples "Custo estimado" e substituir por breakdown, ou manter o total

// No <tbody> por user:
<td align="right">{user.examCount}</td>
<td align="right" className="font-mono text-sm">
  ${user.costByCategory.consultant.toFixed(4)}
</td>
<td align="right" className="font-mono text-sm">
  ${user.costByCategory.extraction.toFixed(4)}
</td>
<td align="right" className="font-mono text-sm">
  ${user.costByCategory.adaptation.toFixed(4)}
</td>
```

Manter a coluna "Custo estimado (USD)" com o total (`estimatedCostUSD`) para manter legibilidade. Reorganizar para: Professor | Email | Conversas | Provas | Consultant | Extração | Adaptação | Total.

- [ ] **Step 2: Criar `usage-exams-table.tsx`**

```tsx
// src/features/admin/usage/components/usage-exams-table.tsx
"use client";

import { DataTableWrapper } from "@/design-system/components/data-table-wrapper";
import { EmptyState } from "@/design-system/components/empty-state";
import type { AdminUsageExam } from "@/features/admin/usage/contracts";

type UsageExamsTableProps = {
  exams: AdminUsageExam[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UsageExamsTable({ exams }: UsageExamsTableProps) {
  if (exams.length === 0) {
    return <EmptyState message="Nenhuma prova com uso registrado." />;
  }

  return (
    <div className="rounded-2xl border border-border-default bg-white p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <strong className="text-sm font-semibold text-text-primary">
            Provas
          </strong>
          <span className="font-mono text-xs text-text-secondary">
            {exams.length} provas
          </span>
        </div>
        <DataTableWrapper>
          <table>
            <thead>
              <tr>
                <th align="left">Tópico</th>
                <th align="left">Status</th>
                <th align="right">Extração (USD)</th>
                <th align="right">Adaptação (USD)</th>
                <th align="right">Total (USD)</th>
                <th align="left">Criada em</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.examId}>
                  <td>{exam.topic ?? "—"}</td>
                  <td className="text-sm text-text-secondary">{exam.status}</td>
                  <td align="right" className="font-mono text-sm">
                    ${exam.extractionCostUSD.toFixed(4)}
                  </td>
                  <td align="right" className="font-mono text-sm">
                    ${exam.adaptationCostUSD.toFixed(4)}
                  </td>
                  <td align="right" className="font-mono text-sm">
                    ${exam.totalCostUSD.toFixed(4)}
                  </td>
                  <td className="text-sm text-text-secondary">
                    {formatDate(exam.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableWrapper>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Atualizar `[userId]/page.tsx` para renderizar a tabela de provas**

```tsx
import { UsageExamsTable } from "@/features/admin/usage/components/usage-exams-table";

// No JSX, ao lado da UsageThreadsTable:
<div className="flex flex-col gap-6">
  <UsageThreadsTable threads={threads} />
  <UsageExamsTable exams={exams} />
</div>
```

- [ ] **Step 4: Rodar typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Rodar todos os testes**

```bash
npm test
```
Esperado: todos PASS

- [ ] **Step 6: Commit final**

```bash
git add src/features/admin/usage/components/usage-users-table.tsx \
  src/features/admin/usage/components/usage-exams-table.tsx \
  src/app/\(admin\)/usage/\[userId\]/page.tsx
git commit -m "feat(ui): add exam cost breakdown to admin usage tables"
```

---

## Verificação Final

- [ ] Rodar suite completa de testes

```bash
npm test
```
Esperado: todos PASS, nenhuma regressão.

- [ ] Rodar typecheck final

```bash
npm run typecheck
```
Esperado: sem erros.
