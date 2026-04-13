# Model Pricing Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover os preços de modelos AI de uma constante hardcoded (`MODEL_PRICING`) para colunas na tabela `ai_models`, permitindo que admins configurem preços via UI.

**Architecture:** Adicionar 4 colunas nullable de preço à tabela `ai_models`. O gateway de usage passa a consultar o banco para resolver preços, com fallback para o modelo `is_default`. A resolução de preços para workflows de exam acontece na camada de serviço (`run-extraction.ts`, `run-analysis-and-adaptation.ts`), que já possui o cliente Supabase. Os workflows param de calcular `estimatedCostUsd` internamente.

**Tech Stack:** TypeScript, Next.js 15, Supabase (PostgreSQL), Zod, Vitest.

---

## File Map

| Arquivo | Ação |
|---|---|
| `supabase/migrations/00019_model_pricing.sql` | Criar — ADD COLUMN nas 4 colunas de preço |
| `supabase/migrations/00020_model_pricing_seed.sql` | Criar — UPDATE com preços dos modelos Anthropic |
| `src/features/admin/models/contracts.ts` | Modificar — adicionar 4 campos aos tipos |
| `src/features/admin/models/validation.ts` | Modificar — adicionar 4 campos aos schemas Zod |
| `src/features/admin/models/service.ts` | Modificar — `toAdminModelView` + `buildModelPatch` |
| `src/app/api/admin/models/route.ts` | Modificar — SELECT + INSERT |
| `src/app/api/admin/models/[id]/route.ts` | Modificar — SELECT + UPDATE |
| `src/gateways/managed-agents/usage.ts` | Modificar — nova `getPricingForModel` async, `fetchActiveEvolutionModel`, nova assinatura de `calculateSimpleCost`, atualizar `syncSessionUsage`, remover `MODEL_PRICING` |
| `src/gateways/managed-agents/index.ts` | Modificar — atualizar re-exports |
| `src/mastra/workflows/extract-exam-workflow.ts` | Modificar — remover `calculateSimpleCost`, remover `estimatedCostUsd` do input de `persistExamUsage` |
| `src/mastra/workflows/analyze-and-adapt-workflow.ts` | Modificar — remover `calculateSimpleCost`, remover `estimatedCostUsd` do input de `persistExamUsage` |
| `src/services/ai/run-extraction.ts` | Modificar — resolver pricing no closure `persistFn` |
| `src/services/ai/run-analysis-and-adaptation.ts` | Modificar — resolver pricing no closure `persistFn` |
| `src/app/(admin)/config/models/page.tsx` | Modificar — adicionar seção de precificação ao formulário |
| `src/test/gateways/usage-pricing.test.ts` | Modificar — reescrever para nova API async |
| `src/gateways/managed-agents/__tests__/usage.test.ts` | Modificar — atualizar mock de Supabase para nova assinatura de `syncSessionUsage` |

---

## Task 1: Migration — adicionar colunas de preço

**Files:**
- Create: `supabase/migrations/00019_model_pricing.sql`

> **Pré-requisito:** verificar que `00018_exam_usage_postgrest_grant.sql` é o último arquivo em `supabase/migrations/`. Se houver um `00019_*.sql`, usar o próximo número disponível.

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- supabase/migrations/00019_model_pricing.sql
ALTER TABLE public.ai_models
  ADD COLUMN input_price_per_million          NUMERIC(10,6) DEFAULT NULL,
  ADD COLUMN output_price_per_million         NUMERIC(10,6) DEFAULT NULL,
  ADD COLUMN cache_read_price_per_million     NUMERIC(10,6) DEFAULT NULL,
  ADD COLUMN cache_creation_price_per_million NUMERIC(10,6) DEFAULT NULL;
```

- [ ] **Step 2: Aplicar a migration no Supabase**

Via MCP `mcp__plugin_supabase_supabase__apply_migration` ou via CLI:
```bash
npx supabase db push
```

Verificar que as colunas aparecem na tabela `ai_models`.

> **RLS / Grants:** as colunas adicionadas herdam as políticas existentes de `ai_models`. O gateway usa o client `service_role` do Supabase server, que ignora RLS — portanto não é necessária uma migration adicional de grant. Se o projeto usar `anon` ou `authenticated` para leituras de modelos, adicionar um `GRANT SELECT` na migration.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00019_model_pricing.sql
git commit -m "feat(db): add price columns to ai_models"
```

---

## Task 2: Migration — seed preços dos modelos Anthropic

**Files:**
- Create: `supabase/migrations/00020_model_pricing_seed.sql`

- [ ] **Step 1: Criar o arquivo de seed**

```sql
-- supabase/migrations/00020_model_pricing_seed.sql
-- Popula os preços dos modelos Anthropic já cadastrados.
-- Se o model_id não existir no banco, o UPDATE é no-op silencioso.
UPDATE public.ai_models SET
  input_price_per_million          = 0.80,
  output_price_per_million         = 4.00,
  cache_read_price_per_million     = 0.08,
  cache_creation_price_per_million = 1.00
WHERE model_id = 'claude-sonnet-4-6';

UPDATE public.ai_models SET
  input_price_per_million          = 0.08,
  output_price_per_million         = 0.40,
  cache_read_price_per_million     = 0.008,
  cache_creation_price_per_million = 0.10
WHERE model_id = 'claude-haiku-4-5';

UPDATE public.ai_models SET
  input_price_per_million          = 15.00,
  output_price_per_million         = 75.00,
  cache_read_price_per_million     = 1.50,
  cache_creation_price_per_million = 18.75
WHERE model_id = 'claude-opus-4-6';
```

- [ ] **Step 2: Aplicar a migration**

Via MCP ou CLI. Verificar que os modelos Anthropic agora têm preços não-nulos.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00020_model_pricing_seed.sql
git commit -m "feat(db): seed Anthropic model prices from hardcoded values"
```

---

## Task 3: Atualizar contratos TypeScript

**Files:**
- Modify: `src/features/admin/models/contracts.ts`

- [ ] **Step 1: Adicionar os 4 campos a `AdminModelRecord` e `AdminModelView`**

Substituir o conteúdo completo por:

```typescript
export type AdminModelRecord = {
  id: string;
  name: string;
  provider: string;
  base_url: string;
  api_key: string;
  model_id: string;
  enabled: boolean;
  is_default: boolean;
  system_role: string | null;
  created_at: string;
  input_price_per_million: number | null;
  output_price_per_million: number | null;
  cache_read_price_per_million: number | null;
  cache_creation_price_per_million: number | null;
};

export type AdminModelView = {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  apiKeyMasked: string;
  modelId: string;
  enabled: boolean;
  isDefault: boolean;
  systemRole: string | null;
  createdAt: string;
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  cacheReadPricePerMillion: number | null;
  cacheCreationPricePerMillion: number | null;
};
```

- [ ] **Step 2: Verificar TypeScript (erros esperados)**

```bash
npx tsc --noEmit
```

Erros esperados em `service.ts` e arquivos de API (os campos ainda não estão mapeados).

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/models/contracts.ts
git commit -m "feat(contracts): add pricing fields to AdminModelRecord and AdminModelView"
```

---

## Task 4: Atualizar schemas de validação

**Files:**
- Modify: `src/features/admin/models/validation.ts`

- [ ] **Step 1: Adicionar os 4 campos nos schemas Zod**

Substituir o conteúdo completo por:

```typescript
import { z } from "zod";

// .optional().nullable(): aceita undefined (campo omitido) e null (limpar valor)
const pricingField = z.number().positive().optional().nullable();

export const createModelSchema = z.object({
  name: z.string().min(1, "O nome do modelo é obrigatório.").max(100),
  provider: z.string().min(1, "O provider é obrigatório.").max(50).default("openai"),
  baseUrl: z.string().url("Informe uma URL válida."),
  apiKey: z.string().min(1, "A chave secreta é obrigatória."),
  modelId: z.string().min(1, "O model ID é obrigatório.").max(100),
  enabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  systemRole: z.string().max(50).nullable().optional(),
  inputPricePerMillion: pricingField,
  outputPricePerMillion: pricingField,
  cacheReadPricePerMillion: pricingField,
  cacheCreationPricePerMillion: pricingField,
});

export const updateModelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  provider: z.string().min(1).max(50).optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  modelId: z.string().min(1).max(100).optional(),
  enabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  systemRole: z.string().max(50).nullable().optional(),
  inputPricePerMillion: pricingField,
  outputPricePerMillion: pricingField,
  cacheReadPricePerMillion: pricingField,
  cacheCreationPricePerMillion: pricingField,
});

export type CreateModelInput = z.infer<typeof createModelSchema>;
export type UpdateModelInput = z.infer<typeof updateModelSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add src/features/admin/models/validation.ts
git commit -m "feat(validation): add optional pricing fields to model schemas"
```

---

## Task 5: Atualizar service de modelos

**Files:**
- Modify: `src/features/admin/models/service.ts`

- [ ] **Step 1: Atualizar `toAdminModelView` e `buildModelPatch`**

Substituir o conteúdo completo por:

```typescript
import type { AdminModelRecord, AdminModelView } from "@/features/admin/models/contracts";
import type { UpdateModelInput } from "@/features/admin/models/validation";
import { maskSecret } from "@/features/admin/shared/mask-secret";

export function toAdminModelView(model: AdminModelRecord): AdminModelView {
  return {
    id: model.id,
    name: model.name,
    provider: model.provider,
    baseUrl: model.base_url,
    apiKeyMasked: maskSecret(model.api_key),
    modelId: model.model_id,
    enabled: model.enabled,
    isDefault: model.is_default,
    systemRole: model.system_role,
    createdAt: model.created_at,
    inputPricePerMillion: model.input_price_per_million,
    outputPricePerMillion: model.output_price_per_million,
    cacheReadPricePerMillion: model.cache_read_price_per_million,
    cacheCreationPricePerMillion: model.cache_creation_price_per_million,
  };
}

export function buildModelPatch(input: UpdateModelInput) {
  const patch: Record<string, unknown> = {};

  if (input.name !== undefined) patch.name = input.name;
  if (input.provider !== undefined) patch.provider = input.provider;
  if (input.baseUrl !== undefined) patch.base_url = input.baseUrl;
  if (input.apiKey !== undefined) patch.api_key = input.apiKey;
  if (input.modelId !== undefined) patch.model_id = input.modelId;
  if (input.enabled !== undefined) patch.enabled = input.enabled;
  if (input.isDefault !== undefined) patch.is_default = input.isDefault;
  if (input.systemRole !== undefined) patch.system_role = input.systemRole;
  if (input.inputPricePerMillion !== undefined) patch.input_price_per_million = input.inputPricePerMillion;
  if (input.outputPricePerMillion !== undefined) patch.output_price_per_million = input.outputPricePerMillion;
  if (input.cacheReadPricePerMillion !== undefined) patch.cache_read_price_per_million = input.cacheReadPricePerMillion;
  if (input.cacheCreationPricePerMillion !== undefined) patch.cache_creation_price_per_million = input.cacheCreationPricePerMillion;

  return patch;
}

export function selectEvolutionModel(models: AdminModelRecord[]) {
  return (
    models.find((model) => model.system_role === "evolution" && model.enabled) ??
    models.find((model) => model.is_default && model.enabled) ??
    models.find((model) => model.enabled) ??
    null
  );
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Erros nas API routes ainda são esperados (SELECT não inclui os campos ainda).

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/models/service.ts
git commit -m "feat(service): map pricing fields in toAdminModelView and buildModelPatch"
```

---

## Task 6: Atualizar API routes de modelos

**Files:**
- Modify: `src/app/api/admin/models/route.ts`
- Modify: `src/app/api/admin/models/[id]/route.ts`

- [ ] **Step 1: Atualizar `route.ts` (GET e POST)**

Substituir o conteúdo completo de `src/app/api/admin/models/route.ts` por:

```typescript
import { withAdminRoute } from "@/app/api/admin/with-admin-route";
import { createModelSchema } from "@/features/admin/models/validation";
import { toAdminModelView } from "@/features/admin/models/service";
import { apiSuccess, apiValidationError, apiInternalError } from "@/services/errors/api-response";

const MODEL_SELECT =
  "id, name, provider, base_url, api_key, model_id, enabled, is_default, system_role, created_at, input_price_per_million, output_price_per_million, cache_read_price_per_million, cache_creation_price_per_million";

export const GET = withAdminRoute(async ({ supabase }) => {
  const { data, error } = await supabase
    .from("ai_models")
    .select(MODEL_SELECT)
    .order("name");

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess((data ?? []).map(toAdminModelView));
});

export const POST = withAdminRoute(async ({ supabase }, request) => {
  const parsed = createModelSchema.safeParse(await request.json());

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  if (parsed.data.isDefault) {
    await supabase.from("ai_models").update({ is_default: false }).neq("id", "");
  }

  const { data, error } = await supabase
    .from("ai_models")
    .insert({
      name: parsed.data.name,
      provider: parsed.data.provider,
      base_url: parsed.data.baseUrl,
      api_key: parsed.data.apiKey,
      model_id: parsed.data.modelId,
      enabled: parsed.data.enabled ?? true,
      is_default: parsed.data.isDefault ?? false,
      system_role: parsed.data.systemRole ?? null,
      input_price_per_million: parsed.data.inputPricePerMillion ?? null,
      output_price_per_million: parsed.data.outputPricePerMillion ?? null,
      cache_read_price_per_million: parsed.data.cacheReadPricePerMillion ?? null,
      cache_creation_price_per_million: parsed.data.cacheCreationPricePerMillion ?? null,
    })
    .select(MODEL_SELECT)
    .single();

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess(toAdminModelView(data), 201);
});
```

- [ ] **Step 2: Atualizar `[id]/route.ts` (PATCH)**

Em `src/app/api/admin/models/[id]/route.ts`, adicionar a constante `MODEL_SELECT` no topo (após os imports) e substituir as duas strings de select explícitas por ela:

```typescript
const MODEL_SELECT =
  "id, name, provider, base_url, api_key, model_id, enabled, is_default, system_role, created_at, input_price_per_million, output_price_per_million, cache_read_price_per_million, cache_creation_price_per_million";
```

Trocar `.select("id, name, ...")` por `.select(MODEL_SELECT)` no PATCH. O `buildModelPatch` já cuida do UPDATE com os novos campos.

- [ ] **Step 3: Verificar TypeScript — zero erros nesses arquivos**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/models/route.ts src/app/api/admin/models/[id]/route.ts
git commit -m "feat(api): include pricing fields in models SELECT, INSERT and UPDATE"
```

---

## Task 7: Preparar testes do gateway de usage (failing first)

**Files:**
- Modify: `src/test/gateways/usage-pricing.test.ts`

Este task escreve os **novos testes antes da implementação**. Os testes devem falhar ao rodar.

- [ ] **Step 1: Reescrever `usage-pricing.test.ts`**

Substituir todo o conteúdo por:

```typescript
// src/test/gateways/usage-pricing.test.ts
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPricingForModel, calculateSimpleCost } from "@/gateways/managed-agents/usage";

/**
 * Cria um mock de SupabaseClient para testar getPricingForModel.
 * A função faz duas queries possíveis:
 *   1. .from("ai_models").select(...).eq("model_id", X).single() — busca específica
 *   2. .from("ai_models").select(...).eq("is_default", true).single() — fallback
 *
 * callCount distingue qual chamada está sendo feita.
 */
function makeSupabaseMock(
  specificRow: Record<string, unknown> | null,
  defaultRow: Record<string, unknown> | null = null,
): SupabaseClient {
  let callCount = 0;

  const mockSingle = vi.fn().mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      return Promise.resolve({
        data: specificRow,
        error: specificRow ? null : { message: "not found" },
      });
    }
    return Promise.resolve({
      data: defaultRow,
      error: defaultRow ? null : { message: "not found" },
    });
  });

  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

  return { from: mockFrom } as unknown as SupabaseClient;
}

function makeModelRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "model-1",
    model_id: "claude-sonnet-4-6",
    is_default: false,
    enabled: true,
    input_price_per_million: 0.80,
    output_price_per_million: 4.00,
    cache_read_price_per_million: 0.08,
    cache_creation_price_per_million: 1.00,
    ...overrides,
  };
}

describe("getPricingForModel", () => {
  it("retorna preços quando modelo tem input e output não-nulos", async () => {
    const supabase = makeSupabaseMock(makeModelRow());
    const pricing = await getPricingForModel(supabase, "claude-sonnet-4-6");
    expect(pricing.inputPerMillion).toBe(0.80);
    expect(pricing.outputPerMillion).toBe(4.00);
    expect(pricing.cacheReadPerMillion).toBe(0.08);
    expect(pricing.cacheCreationPerMillion).toBe(1.00);
  });

  it("usa zero para campos de cache nulos", async () => {
    const supabase = makeSupabaseMock(
      makeModelRow({ cache_read_price_per_million: null, cache_creation_price_per_million: null }),
    );
    const pricing = await getPricingForModel(supabase, "claude-sonnet-4-6");
    expect(pricing.cacheReadPerMillion).toBe(0);
    expect(pricing.cacheCreationPerMillion).toBe(0);
  });

  it("faz fallback para is_default quando modelo não tem preços", async () => {
    const supabase = makeSupabaseMock(
      null, // modelo específico não tem preços
      makeModelRow({ model_id: "claude-haiku-4-5", is_default: true, input_price_per_million: 0.08, output_price_per_million: 0.40 }),
    );
    const pricing = await getPricingForModel(supabase, "unknown-model");
    expect(pricing.inputPerMillion).toBe(0.08);
  });

  it("lança erro quando nenhum modelo tem preços configurados", async () => {
    const supabase = makeSupabaseMock(null, null);
    await expect(getPricingForModel(supabase, "unknown-model")).rejects.toThrow(
      "No pricing configured",
    );
  });
});

describe("calculateSimpleCost", () => {
  it("calcula custo corretamente com pricing de sonnet", () => {
    const pricing = {
      inputPerMillion: 0.80,
      outputPerMillion: 4.00,
      cacheReadPerMillion: 0.08,
      cacheCreationPerMillion: 1.00,
    };
    const cost = calculateSimpleCost({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, pricing);
    expect(cost).toBeCloseTo(4.80); // 0.80 + 4.00
  });

  it("calcula custo corretamente com pricing de haiku", () => {
    const pricing = {
      inputPerMillion: 0.08,
      outputPerMillion: 0.40,
      cacheReadPerMillion: 0.008,
      cacheCreationPerMillion: 0.10,
    };
    const cost = calculateSimpleCost({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, pricing);
    expect(cost).toBeCloseTo(0.48); // 0.08 + 0.40
  });

  it("retorna zero para zero tokens", () => {
    const pricing = {
      inputPerMillion: 0.80,
      outputPerMillion: 4.00,
      cacheReadPerMillion: 0,
      cacheCreationPerMillion: 0,
    };
    const cost = calculateSimpleCost({ inputTokens: 0, outputTokens: 0 }, pricing);
    expect(cost).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar os testes — confirmar que FALHAM**

```bash
npx vitest run src/test/gateways/usage-pricing.test.ts
```

Esperado: FAIL — `getPricingForModel` ainda tem assinatura síncrona, `calculateSimpleCost` ainda recebe `modelId`.

---

## Task 8: Implementar novo gateway de usage

> **Atenção:** este task, junto com Tasks 9, 10 e 11, formam um bloco atômico. O TypeScript e os testes **não compilarão completamente** até o final do Task 11. Commitar cada task individualmente está ok, mas executar `npx tsc --noEmit` ou `npx vitest run` com sucesso completo só é possível após o Task 11.

**Files:**
- Modify: `src/gateways/managed-agents/usage.ts`
- Modify: `src/gateways/managed-agents/index.ts`

- [ ] **Step 1: Reescrever `usage.ts`**

Substituir o conteúdo completo por:

```typescript
import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { selectEvolutionModel } from "@/features/admin/models/service";
import type { AdminModelRecord } from "@/features/admin/models/contracts";

// Preços por 1M tokens — agora vêm do banco de dados (tabela ai_models).
export type ModelPricing = {
  inputPerMillion: number;
  outputPerMillion: number;
  cacheReadPerMillion: number;
  cacheCreationPerMillion: number;
};

const MODEL_PRICE_FIELDS =
  "id, model_id, is_default, enabled, input_price_per_million, output_price_per_million, cache_read_price_per_million, cache_creation_price_per_million";

export async function getPricingForModel(
  supabase: SupabaseClient,
  modelId: string,
): Promise<ModelPricing> {
  // 1. Tenta o modelo específico com input e output preenchidos
  const { data: specificModel } = await supabase
    .from("ai_models")
    .select(MODEL_PRICE_FIELDS)
    .eq("model_id", modelId)
    .single();

  if (
    specificModel?.input_price_per_million != null &&
    specificModel?.output_price_per_million != null
  ) {
    return rowToPricing(specificModel);
  }

  // 2. Fallback: modelo is_default com preço configurado
  const { data: defaultModel } = await supabase
    .from("ai_models")
    .select(MODEL_PRICE_FIELDS)
    .eq("is_default", true)
    .single();

  if (
    defaultModel?.input_price_per_million != null &&
    defaultModel?.output_price_per_million != null
  ) {
    return rowToPricing(defaultModel);
  }

  throw new Error(
    `No pricing configured for model "${modelId}" and no default model with pricing found`,
  );
}

function rowToPricing(row: Record<string, unknown>): ModelPricing {
  return {
    inputPerMillion: row.input_price_per_million as number,
    outputPerMillion: row.output_price_per_million as number,
    cacheReadPerMillion: (row.cache_read_price_per_million as number | null) ?? 0,
    cacheCreationPerMillion: (row.cache_creation_price_per_million as number | null) ?? 0,
  };
}

export function calculateSimpleCost(
  usage: { inputTokens: number; outputTokens: number },
  pricing: ModelPricing,
): number {
  return (
    (usage.inputTokens / 1_000_000) * pricing.inputPerMillion +
    (usage.outputTokens / 1_000_000) * pricing.outputPerMillion
  );
}

/**
 * Busca todos os modelos do banco e aplica a lógica de seleção do modelo ativo
 * (evolution → default → any enabled). Usado por syncSessionUsage.
 *
 * Limitação: consultant_threads não registra o model_id por mensagem —
 * usamos o modelo ativo no momento do cálculo como aproximação.
 */
async function fetchActiveEvolutionModel(supabase: SupabaseClient): Promise<AdminModelRecord> {
  const { data } = await supabase.from("ai_models").select(
    "id, name, provider, base_url, api_key, model_id, enabled, is_default, system_role, created_at, input_price_per_million, output_price_per_million, cache_read_price_per_million, cache_creation_price_per_million",
  );
  const models = (data ?? []) as AdminModelRecord[];
  const active = selectEvolutionModel(models);

  if (!active) {
    throw new Error("No active model found for usage calculation");
  }

  return active;
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

  const activeModel = await fetchActiveEvolutionModel(supabase);
  const pricing = await getPricingForModel(supabase, activeModel.model_id);

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

- [ ] **Step 2: Atualizar re-exports em `index.ts`**

Substituir a linha de export de `usage` em `src/gateways/managed-agents/index.ts`:

```typescript
// ANTES:
export { syncSessionUsage, MODEL_PRICING, getPricingForModel, calculateSimpleCost } from "./usage";

// DEPOIS:
export { syncSessionUsage, getPricingForModel, calculateSimpleCost } from "./usage";
export type { ModelPricing } from "./usage";
```

- [ ] **Step 3: Rodar os testes de `usage-pricing` — confirmar que PASSAM**

```bash
npx vitest run src/test/gateways/usage-pricing.test.ts
```

Esperado: PASS (a nova `getPricingForModel` e `calculateSimpleCost` têm as assinaturas corretas).

- [ ] **Step 4: Commit**

```bash
git add src/gateways/managed-agents/usage.ts src/gateways/managed-agents/index.ts
git commit -m "feat(gateway): async getPricingForModel from DB, updated calculateSimpleCost signature"
```

> **TypeScript neste ponto:** os workflows ainda importam `calculateSimpleCost` com assinatura antiga — erros de tipo esperados até o Task 9 ser concluído.

---

## Task 9: Atualizar workflows para remover cálculo de custo interno

**Files:**
- Modify: `src/mastra/workflows/extract-exam-workflow.ts`
- Modify: `src/mastra/workflows/analyze-and-adapt-workflow.ts`

Os workflows param de calcular `estimatedCostUsd`. Passam apenas tokens brutos + `modelId` para `persistExamUsage`.

- [ ] **Step 1: Atualizar `extract-exam-workflow.ts`**

1. **Remover** a linha de import:
```typescript
import { calculateSimpleCost } from "@/gateways/managed-agents/usage";
```

2. **Atualizar** o tipo de `persistExamUsage` em `ExtractionWorkflowDependencies` — remover `estimatedCostUsd`:
```typescript
persistExamUsage?(input: {
  examId: string;
  stage: "extraction" | "adaptation";
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  // estimatedCostUsd REMOVIDO — calculado pela camada de serviço
}): Promise<void>;
```

3. **Nas duas chamadas** de `dependencies.persistExamUsage?.({...})` dentro de `persistStep.execute`, remover o campo `estimatedCostUsd`:

```typescript
// Trecho atual (remover estimatedCostUsd e a chamada de calculateSimpleCost):
await dependencies.persistExamUsage?.({
  examId: inputData.metadata.examId,
  stage: "extraction",
  modelId: inputData.usage.modelId,
  inputTokens: inputData.usage.inputTokens,
  outputTokens: inputData.usage.outputTokens,
});
```

- [ ] **Step 2: Atualizar `analyze-and-adapt-workflow.ts`**

Mesmas 3 mudanças que acima:
1. Remover `import { calculateSimpleCost }` da linha de import no topo
2. Remover `estimatedCostUsd` de `AnalyzeAndAdaptDependencies.persistExamUsage`
3. Nas **duas** chamadas de `dependencies.persistExamUsage?.({...})` (buscar linhas que contêm `calculateSimpleCost`), remover `estimatedCostUsd` e a chamada de `calculateSimpleCost`:

```typescript
await dependencies.persistExamUsage?.({
  examId: inputData.context.exam.id,
  stage: "adaptation",
  modelId: sharedModelId,
  inputTokens: totalInputTokens,
  outputTokens: totalOutputTokens,
});
```

- [ ] **Step 3: Commit**

```bash
git add src/mastra/workflows/extract-exam-workflow.ts src/mastra/workflows/analyze-and-adapt-workflow.ts
git commit -m "feat(workflows): remove cost calculation — delegate to service layer"
```

> **TypeScript neste ponto:** os services ainda tipam `persistFn` com `estimatedCostUsd` que veio do workflow — erros de tipo esperados até o Task 10.

---

## Task 10: Atualizar camada de serviço para resolver pricing

**Files:**
- Modify: `src/services/ai/run-extraction.ts`
- Modify: `src/services/ai/run-analysis-and-adaptation.ts`

A camada de serviço agora é responsável por:
1. Receber tokens brutos + `modelId` do workflow via `persistFn`
2. Resolver `ModelPricing` via `getPricingForModel`
3. Calcular `estimatedCostUsd` com `calculateSimpleCost`
4. Chamar `persistExamUsageGateway` com o custo calculado

> **Importante sobre o timing:** `getPricingForModel` é chamado **dentro do closure `persistFn`** (quando o usage é persistido), não antes de o workflow iniciar. O `modelId` só é conhecido quando o workflow emite o uso, por isso o pricing é resolvido no momento da persistência.

- [ ] **Step 1: Substituir `run-extraction.ts`**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ExtractionWorkflowInput,
  ExtractionWorkflowResult,
} from "@/mastra/contracts/extraction-contracts";
import {
  createExtractExamWorkflow,
  runExtractExamWorkflow,
} from "@/mastra/workflows/extract-exam-workflow";
import { persistExamUsage as persistExamUsageGateway } from "@/gateways/exam-usage/persist";
import { getPricingForModel, calculateSimpleCost } from "@/gateways/managed-agents/usage";
import { createPrismaMastraRuntime } from "@/mastra/runtime";

type RunExtractionDeps = Omit<
  Parameters<typeof createExtractExamWorkflow>[0],
  "persistExamUsage"
>;

// Tipo do input que o workflow passa para persistExamUsage (sem estimatedCostUsd)
type WorkflowUsageInput = {
  examId: string;
  stage: "extraction" | "adaptation";
  modelId: string;
  inputTokens: number;
  outputTokens: number;
};

export async function runExtraction(
  input: ExtractionWorkflowInput,
  dependencies: RunExtractionDeps,
  supabase?: SupabaseClient,
): Promise<ExtractionWorkflowResult> {
  const persistFn = supabase
    ? async (usageInput: WorkflowUsageInput) => {
        try {
          const pricing = await getPricingForModel(supabase, usageInput.modelId);
          const estimatedCostUsd = calculateSimpleCost(usageInput, pricing);
          await persistExamUsageGateway(supabase, { ...usageInput, estimatedCostUsd });
        } catch (err) {
          console.error("[exam-usage] Failed to persist extraction usage:", err);
        }
      }
    : undefined;

  const workflow = createExtractExamWorkflow({
    ...dependencies,
    persistExamUsage: persistFn,
  });
  const mastra = createPrismaMastraRuntime({
    extractExamWorkflow: workflow,
  });
  const registeredWorkflow = mastra.getWorkflowById(workflow.id) as typeof workflow;
  const result = await runExtractExamWorkflow(registeredWorkflow, input);

  if (result.status !== "success") {
    throw new Error("Falha ao executar o workflow de extração.");
  }

  return result.result as ExtractionWorkflowResult;
}
```

- [ ] **Step 2: Atualizar `run-analysis-and-adaptation.ts`**

Adicionar as importações e aplicar o mesmo padrão de `persistFn`:

```typescript
// Adicionar aos imports existentes:
import { getPricingForModel, calculateSimpleCost } from "@/gateways/managed-agents/usage";

// Tipo do input que o workflow passa para persistExamUsage (sem estimatedCostUsd)
type WorkflowUsageInput = {
  examId: string;
  stage: "extraction" | "adaptation";
  modelId: string;
  inputTokens: number;
  outputTokens: number;
};

// Substituir o persistFn existente por:
const persistFn = supabase
  ? async (usageInput: WorkflowUsageInput) => {
      try {
        const pricing = await getPricingForModel(supabase, usageInput.modelId);
        const estimatedCostUsd = calculateSimpleCost(usageInput, pricing);
        await persistExamUsageGateway(supabase, { ...usageInput, estimatedCostUsd });
      } catch (err) {
        console.error("[exam-usage] Failed to persist adaptation usage:", err);
      }
    }
  : undefined;
```

- [ ] **Step 3: Verificar TypeScript — zero erros**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Rodar todos os testes**

```bash
npx vitest run
```

> Os testes de `syncSessionUsage` provavelmente vão falhar neste ponto porque o mock de Supabase não suporta ainda as queries de modelos. Isso é esperado e será corrigido no próximo task.

- [ ] **Step 5: Commit**

```bash
git add src/services/ai/run-extraction.ts src/services/ai/run-analysis-and-adaptation.ts
git commit -m "feat(services): resolve model pricing from DB before persisting exam usage"
```

---

## Task 11: Atualizar testes de `syncSessionUsage`

**Files:**
- Modify: `src/gateways/managed-agents/__tests__/usage.test.ts`

`syncSessionUsage` agora faz queries ao Supabase para resolver o modelo ativo e seus preços. O mock precisa suportar:
- `from("ai_models").select(...)` sem `.eq()` → retorna lista (para `fetchActiveEvolutionModel`)
- `from("ai_models").select(...).eq("model_id", X).single()` → retorna modelo com preço (para `getPricingForModel`)
- `from("ai_models").select(...).eq("is_default", true).single()` → fallback (se necessário)
- `from("consultant_threads").update(...)` → sem mudança

- [ ] **Step 1: Reescrever `usage.test.ts`**

Substituir o conteúdo completo por:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { syncSessionUsage } from "../usage";

const mockSessionRetrieve = vi.fn();

const mockAnthropicClient = {
  beta: {
    sessions: {
      retrieve: mockSessionRetrieve,
    },
  },
} as unknown as Anthropic;

const SONNET_ROW = {
  id: "model-1",
  model_id: "claude-sonnet-4-6",
  name: "Sonnet",
  provider: "anthropic",
  base_url: "https://api.anthropic.com",
  api_key: "sk-test",
  enabled: true,
  is_default: true,
  system_role: "evolution",
  created_at: "2025-01-01T00:00:00Z",
  input_price_per_million: 0.80,
  output_price_per_million: 4.00,
  cache_read_price_per_million: 0.08,
  cache_creation_price_per_million: 1.00,
};

/**
 * Cria um mock de Supabase para syncSessionUsage.
 *
 * syncSessionUsage faz 3 tipos de queries:
 *   1. from("ai_models").select(*) → fetchActiveEvolutionModel (sem .eq, retorna array)
 *   2. from("ai_models").select(...).eq("model_id", X).single() → getPricingForModel (específico)
 *   3. from("consultant_threads").update(...).eq("id", threadId) → persiste
 *
 * O truque: o mock retorna um objeto com .select() que, dependendo se
 * .eq() é chamado, retorna dados diferentes.
 */
function makeSupabaseMock(modelRow = SONNET_ROW) {
  const mockThreadEq = vi.fn().mockResolvedValue({ error: null });
  const mockThreadUpdate = vi.fn().mockReturnValue({ eq: mockThreadEq });

  // Para getPricingForModel: .select(...).eq(...).single()
  const mockSingle = vi.fn().mockResolvedValue({ data: modelRow, error: null });
  const mockPricingEq = vi.fn().mockReturnValue({ single: mockSingle });

  // O objeto retornado por from("ai_models").select(...)
  // Suporta tanto a query sem .eq (fetchActiveEvolutionModel) quanto com .eq (getPricingForModel)
  const aiModelsSelectResult = {
    eq: mockPricingEq,
    // Supabase client retorna uma Promise-like via .then quando não há .eq
    // fetchActiveEvolutionModel chama await supabase.from(...).select(...)
    then: (resolve: (v: { data: unknown[]; error: null }) => void, _reject: unknown) => {
      return Promise.resolve({ data: [modelRow], error: null }).then(resolve);
    },
    catch: (fn: (err: unknown) => void) => fn,
    finally: (fn: () => void) => { fn(); return Promise.resolve({ data: [modelRow], error: null }); },
  };

  const mockAiModelsSelect = vi.fn().mockReturnValue(aiModelsSelectResult);

  const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === "consultant_threads") {
      return { update: mockThreadUpdate };
    }
    return { select: mockAiModelsSelect };
  });

  return {
    supabase: { from: mockFrom } as unknown as SupabaseClient,
    mockFrom,
    mockThreadUpdate,
    mockThreadEq,
  };
}

describe("syncSessionUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve calcular custo correto usando preços do banco (1M de cada tipo de token)", async () => {
    mockSessionRetrieve.mockResolvedValue({
      usage: {
        input_tokens: 1_000_000,
        output_tokens: 1_000_000,
        cache_read_input_tokens: 1_000_000,
        cache_creation_input_tokens: 1_000_000,
      },
    });
    const { supabase, mockThreadUpdate } = makeSupabaseMock();

    await syncSessionUsage(mockAnthropicClient, supabase, "thread-1", "sess-1");

    const updateArg = mockThreadUpdate.mock.calls[0][0];
    // Preços do SONNET_ROW: 0.80 + 4.00 + 0.08 + 1.00 = 5.88
    expect(updateArg.estimated_cost_usd).toBeCloseTo(5.88, 5);
  });

  it("deve persistir os 4 contadores de token no Supabase", async () => {
    mockSessionRetrieve.mockResolvedValue({
      usage: {
        input_tokens: 5000,
        output_tokens: 3200,
        cache_read_input_tokens: 20000,
        cache_creation_input_tokens: 2000,
      },
    });
    const { supabase, mockFrom, mockThreadUpdate, mockThreadEq } = makeSupabaseMock();

    await syncSessionUsage(mockAnthropicClient, supabase, "thread-abc", "sess-abc");

    expect(mockFrom).toHaveBeenCalledWith("consultant_threads");
    expect(mockThreadUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        total_input_tokens: 5000,
        total_output_tokens: 3200,
        total_cache_read_tokens: 20000,
        total_cache_creation_tokens: 2000,
      }),
    );
    expect(mockThreadEq).toHaveBeenCalledWith("id", "thread-abc");
  });

  it("deve definir last_usage_sync_at como ISO string recente", async () => {
    mockSessionRetrieve.mockResolvedValue({ usage: {} });
    const { supabase, mockThreadUpdate } = makeSupabaseMock();

    const before = Date.now();
    await syncSessionUsage(mockAnthropicClient, supabase, "thread-1", "sess-1");
    const after = Date.now();

    const updateArg = mockThreadUpdate.mock.calls[0][0];
    const syncedAt = new Date(updateArg.last_usage_sync_at).getTime();
    expect(syncedAt).toBeGreaterThanOrEqual(before);
    expect(syncedAt).toBeLessThanOrEqual(after);
  });

  it("deve tratar usage ausente como zeros", async () => {
    mockSessionRetrieve.mockResolvedValue({});
    const { supabase, mockThreadUpdate } = makeSupabaseMock();

    await syncSessionUsage(mockAnthropicClient, supabase, "thread-1", "sess-1");

    const updateArg = mockThreadUpdate.mock.calls[0][0];
    expect(updateArg.total_input_tokens).toBe(0);
    expect(updateArg.total_output_tokens).toBe(0);
    expect(updateArg.total_cache_read_tokens).toBe(0);
    expect(updateArg.total_cache_creation_tokens).toBe(0);
    expect(updateArg.estimated_cost_usd).toBe(0);
  });

  it("deve propagar erro quando SDK falha (caller captura)", async () => {
    mockSessionRetrieve.mockRejectedValue(new Error("API error"));
    const { supabase } = makeSupabaseMock();

    await expect(
      syncSessionUsage(mockAnthropicClient, supabase, "thread-1", "sess-1"),
    ).rejects.toThrow("API error");
  });
});
```

> **Nota sobre o mock:** o `then/catch/finally` no `aiModelsSelectResult` simula o comportamento thenable de Supabase (que é uma Promise-like). Se os testes ainda falharem por causa do mock de `fetchActiveEvolutionModel`, considere usar `vi.mock("@/features/admin/models/service", ...)` para mockar `selectEvolutionModel` diretamente, ou extrair `fetchActiveEvolutionModel` como um export e mocká-la com `vi.spyOn`.

- [ ] **Step 2: Rodar os testes de usage**

```bash
npx vitest run src/gateways/managed-agents/__tests__/usage.test.ts
```

Se o mock de Supabase não funcionar perfeitamente na primeira tentativa, ajustar o mock — não ajustar a implementação. O comportamento observável (valores corretos em `consultant_threads.update`) é o que importa.

- [ ] **Step 3: Rodar toda a suite de testes**

```bash
npx vitest run
```

Esperado: todos os testes passam.

- [ ] **Step 4: Verificar TypeScript completamente**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 5: Commit**

```bash
git add src/gateways/managed-agents/__tests__/usage.test.ts
git commit -m "test(usage): update syncSessionUsage tests for DB-driven pricing"
```

---

## Task 12: Atualizar UI do formulário de modelos

**Files:**
- Modify: `src/app/(admin)/config/models/page.tsx`

- [ ] **Step 1: Adicionar 4 campos ao `useState` do formulário**

No `useState` inicial, adicionar após `isDefault: false`:

```typescript
inputPricePerMillion: "",
outputPricePerMillion: "",
cacheReadPricePerMillion: "",
cacheCreationPricePerMillion: "",
```

- [ ] **Step 2: Adicionar os mesmos campos no `resetForm`**

```typescript
function resetForm() {
  setEditingId(null);
  setForm({
    name: "",
    provider: "openai",
    baseUrl: "",
    apiKey: "",
    modelId: "",
    systemRole: "",
    enabled: true,
    isDefault: false,
    inputPricePerMillion: "",
    outputPricePerMillion: "",
    cacheReadPricePerMillion: "",
    cacheCreationPricePerMillion: "",
  });
}
```

- [ ] **Step 3: Adicionar no `setForm` ao clicar em "Editar"**

No handler do botão "Editar", dentro do `setForm({...})`, adicionar após `isDefault: model.isDefault`:

```typescript
inputPricePerMillion: model.inputPricePerMillion?.toString() ?? "",
outputPricePerMillion: model.outputPricePerMillion?.toString() ?? "",
cacheReadPricePerMillion: model.cacheReadPricePerMillion?.toString() ?? "",
cacheCreationPricePerMillion: model.cacheCreationPricePerMillion?.toString() ?? "",
```

- [ ] **Step 4: Adicionar os campos ao body do `handleSubmit`**

No `JSON.stringify({...})` dentro de `handleSubmit`, adicionar após `isDefault: form.isDefault`:

```typescript
inputPricePerMillion: form.inputPricePerMillion ? parseFloat(form.inputPricePerMillion) : null,
outputPricePerMillion: form.outputPricePerMillion ? parseFloat(form.outputPricePerMillion) : null,
cacheReadPricePerMillion: form.cacheReadPricePerMillion ? parseFloat(form.cacheReadPricePerMillion) : null,
cacheCreationPricePerMillion: form.cacheCreationPricePerMillion ? parseFloat(form.cacheCreationPricePerMillion) : null,
```

- [ ] **Step 5: Adicionar seção "Precificação" ao formulário JSX**

Após o `<div className="grid gap-4 sm:grid-cols-2">` existente (o grid com nome, provider, url, etc.), adicionar nova seção antes do `<div className="flex items-center gap-6">` dos checkboxes:

```tsx
<div>
  <p className="mb-2 text-xs font-medium text-text-secondary">
    Precificação (USD por 1M tokens) — opcional
  </p>
  <div className="grid gap-3 sm:grid-cols-2">
    <input
      aria-label="Preço por 1M tokens de entrada (USD)"
      className="rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      min="0"
      onChange={(event) => setForm((current) => ({ ...current, inputPricePerMillion: event.target.value }))}
      placeholder="Entrada (ex: 0.80)"
      step="any"
      type="number"
      value={form.inputPricePerMillion}
    />
    <input
      aria-label="Preço por 1M tokens de saída (USD)"
      className="rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      min="0"
      onChange={(event) => setForm((current) => ({ ...current, outputPricePerMillion: event.target.value }))}
      placeholder="Saída (ex: 4.00)"
      step="any"
      type="number"
      value={form.outputPricePerMillion}
    />
    <input
      aria-label="Preço por 1M tokens de cache lido (USD)"
      className="rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      min="0"
      onChange={(event) => setForm((current) => ({ ...current, cacheReadPricePerMillion: event.target.value }))}
      placeholder="Cache lido (ex: 0.08)"
      step="any"
      type="number"
      value={form.cacheReadPricePerMillion}
    />
    <input
      aria-label="Preço por 1M tokens de cache criado (USD)"
      className="rounded-xl border border-border-default px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      min="0"
      onChange={(event) => setForm((current) => ({ ...current, cacheCreationPricePerMillion: event.target.value }))}
      placeholder="Cache criado (ex: 1.00)"
      step="any"
      type="number"
      value={form.cacheCreationPricePerMillion}
    />
  </div>
</div>
```

- [ ] **Step 6: Adicionar badge de aviso na listagem**

Na seção de `<div className="flex flex-wrap gap-2">` de cada modelo (após os outros badges), adicionar:

```tsx
{model.enabled && (model.inputPricePerMillion == null || model.outputPricePerMillion == null) ? (
  <StatusBadge label="Sem preço" tone="secondary" />
) : null}
```

> **Nota:** verificar se `StatusBadge` suporta um tom de aviso (ex: `"warning"`). Se disponível, prefer usar `tone="warning"`. Se não, `tone="secondary"` serve como fallback visível.

- [ ] **Step 7: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add src/app/(admin)/config/models/page.tsx
git commit -m "feat(ui): add pricing fields to admin models form with missing-price badge"
```

---

## Task 13: Verificação final

- [ ] **Step 1: Rodar toda a suite de testes**

```bash
npx vitest run
```

Esperado: todos os testes passam.

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 3: Testar manualmente no browser**

1. Acessar `/config/models`
2. Verificar que modelos Anthropic exibem preços (seed da migration)
3. Editar um modelo e salvar com preços — confirmar persistência
4. Criar um modelo sem preços — confirmar que badge "Sem preço" aparece
5. Verificar `/admin/usage` — os custos devem continuar aparecendo normalmente

- [ ] **Step 4: Commit de ajustes se necessário**

```bash
git add -p
git commit -m "fix: post-integration adjustments for model pricing"
```
