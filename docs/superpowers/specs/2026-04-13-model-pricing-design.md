# Model Pricing Configuration

**Date:** 2026-04-13
**Status:** Approved

## Problem

Os valores de conversão de custo em `src/gateways/managed-agents/usage.ts` são hardcoded na constante `MODEL_PRICING`. Isso impede que novos modelos sejam precificados sem alteração de código, e cria uma fonte de verdade paralela ao cadastro de modelos já existente na tabela `ai_models`. Além disso, `syncSessionUsage` hardcoda o `model_id` como `"claude-sonnet-4-6"`, ignorando o modelo real da thread.

## Goal

Permitir que administradores cadastrem os preços de cada modelo dentro da seção de modelos no painel admin. O sistema deve usar esses preços para calcular o custo estimado de cada operação (threads e exams), de acordo com o modelo utilizado.

## Out of Scope

- Recálculo de custos históricos já persistidos
- Sistema de presets ou auto-preenchimento de preços por provider
- Cache em memória de preços (as queries ao DB são suficientes)

## Data Model

### Migration: adicionar colunas de preço à `ai_models`

```sql
ALTER TABLE public.ai_models
  ADD COLUMN input_price_per_million          NUMERIC(10,6) DEFAULT NULL,
  ADD COLUMN output_price_per_million         NUMERIC(10,6) DEFAULT NULL,
  ADD COLUMN cache_read_price_per_million     NUMERIC(10,6) DEFAULT NULL,
  ADD COLUMN cache_creation_price_per_million NUMERIC(10,6) DEFAULT NULL;
```

Colunas nullable — modelos sem preço usam fallback. Precisão `NUMERIC(10,6)` alinhada ao restante do sistema.

### Seed: popular modelos Anthropic existentes

Os preços hardcoded de `MODEL_PRICING` são migrados via `UPDATE` direto, atualizando apenas registros existentes. Se o `model_id` não existir, o `UPDATE` é no-op silencioso.

```sql
UPDATE public.ai_models SET
  input_price_per_million = 0.80, output_price_per_million = 4.00,
  cache_read_price_per_million = 0.08, cache_creation_price_per_million = 1.00
WHERE model_id = 'claude-sonnet-4-6';

UPDATE public.ai_models SET
  input_price_per_million = 0.08, output_price_per_million = 0.40,
  cache_read_price_per_million = 0.008, cache_creation_price_per_million = 0.10
WHERE model_id = 'claude-haiku-4-5';

UPDATE public.ai_models SET
  input_price_per_million = 15.00, output_price_per_million = 75.00,
  cache_read_price_per_million = 1.50, cache_creation_price_per_million = 18.75
WHERE model_id = 'claude-opus-4-6';
```

## TypeScript Contracts

### `features/admin/models/contracts.ts`

Adicionar campos aos tipos existentes:

```typescript
type AdminModelRecord = {
  // ...campos existentes...
  input_price_per_million: number | null;
  output_price_per_million: number | null;
  cache_read_price_per_million: number | null;
  cache_creation_price_per_million: number | null;
};

type AdminModelView = {
  // ...campos existentes...
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  cacheReadPricePerMillion: number | null;
  cacheCreationPricePerMillion: number | null;
};
```

### `features/admin/models/validation.ts`

Adicionar os 4 campos como opcionais nos schemas de criação e atualização. Composição Zod: `z.number().positive().optional().nullable()` (`.optional()` antes de `.nullable()` para aceitar `undefined` na omissão e `null` para limpar o valor).

## Gateway de Usage

### Lógica de resolução de preços

Nova função assíncrona em `src/gateways/managed-agents/usage.ts`:

```typescript
async function getPricingForModel(
  supabase: SupabaseClient,
  modelId: string
): Promise<ModelPricing>
```

**Lógica de resolução:**
1. Busca `ai_models` onde `model_id = modelId` e `input_price_per_million` e `output_price_per_million` são não-nulos
2. Se encontrado → retorna os preços (campos de cache podem ser nulos; usar `0` como fallback)
3. Se não → busca `ai_models` onde `is_default = true` e `input_price_per_million` não-nulo
4. Se ainda não → lança erro: `Error: No pricing configured for model "${modelId}" and no default model with pricing found`

### Impacto em `syncSessionUsage`

A tabela `consultant_threads` não tem coluna `model_id`. `syncSessionUsage` usa o modelo ativo da sessão como aproximação para o cálculo de custo — a mesma limitação do comportamento atual (que hardcoda Sonnet). Para resolver o modelo ativo, criar uma função auxiliar DB-aware no gateway:

```typescript
async function fetchActiveEvolutionModel(supabase: SupabaseClient): Promise<AdminModelRecord>
```

Que busca todos os modelos do DB e aplica `selectEvolutionModel` (função pura existente em `service.ts`) ao resultado.

> **Limitação documentada:** threads não registram qual modelo foi efetivamente usado em cada mensagem. O custo é estimado com base no modelo ativo no momento do cálculo, não no modelo que gerou cada resposta.

### Impacto em `calculateSimpleCost`

Nova assinatura — recebe `ModelPricing` já resolvido:

```typescript
function calculateSimpleCost(usage: ExamUsage, pricing: ModelPricing): number
```

### Workflows de exam — resolução de pricing na camada de serviço

`ExtractionWorkflowDependencies` e `AnalyzeAndAdaptDependencies` **não recebem `supabase`**. A resolução de pricing acontece na camada de serviço (`run-extraction.ts`, `run-analysis-and-adaptation.ts`), que já possui o cliente Supabase.

O serviço resolve o pricing antes de montar a dependência `persistExamUsage`:

```typescript
// Em run-extraction.ts (camada de serviço):
const pricing = await getPricingForModel(supabase, usage.modelId);

await runExtractionWorkflow({
  // ...
  persistExamUsage: async (usage) => {
    const cost = calculateSimpleCost(usage, pricing);
    await persistExamUsage(supabase, { ...usage, estimatedCostUsd: cost });
  },
});
```

Dessa forma, os tipos de dependência dos workflows permanecem sem `supabase`, preservando a separação existente.

**Remover:** `MODEL_PRICING` e a função `getPricingForModel` síncrona são deletadas após todos os callers serem atualizados.

## Service de Modelos

`src/features/admin/models/service.ts`:
- `toAdminModelView()` — mapear os 4 novos campos de `AdminModelRecord` para `AdminModelView`
- `buildModelPatch()` — incluir os 4 campos no patch de update
- `selectEvolutionModel()` — sem alteração, continua sendo função pura que recebe array

## API Routes de Modelos

- `src/app/api/admin/models/route.ts` (GET/POST): adicionar os 4 campos ao `SELECT` explícito + `INSERT`
- `src/app/api/admin/models/[id]/route.ts` (PATCH): adicionar os 4 campos ao `SELECT` + `UPDATE`

## Public Gateway Index

`src/gateways/managed-agents/index.ts` — atualizar re-export de `calculateSimpleCost` para refletir nova assinatura.

## UI Admin — Formulário de Modelos

Adicionar seção "Precificação" ao formulário em `src/app/(admin)/config/models/page.tsx`:
- 4 campos numéricos opcionais (input, output, cache_read, cache_creation)
- Adicionar ao estado inicial do `form` e ao `resetForm`
- Badge/aviso quando `enabled = true` e `inputPricePerMillion` ou `outputPricePerMillion` é nulo

## Testes

**`src/test/gateways/usage-pricing.test.ts`:**
- Remover testes de `MODEL_PRICING` hardcoded e de `getPricingForModel` síncrono
- Adicionar testes de `getPricingForModel` assíncrono (mock Supabase): modelo com preço, fallback default, erro sem preços, cache nulo → zero
- Reescrever testes de `calculateSimpleCost` para nova assinatura (recebe `ModelPricing`, não `modelId`)

**`src/gateways/managed-agents/__tests__/usage.test.ts`:**
- Atualizar `syncSessionUsage` para novo fluxo de resolução de modelo via `fetchActiveEvolutionModel`
- Atualizar valores esperados de custo que hardcodam precificação do Sonnet

## Rollout

1. Migration SQL: adicionar colunas de preço à `ai_models`
2. Migration de seed: popular modelos Anthropic via `UPDATE`
3. Atualizar contratos TypeScript (`contracts.ts`, `validation.ts`)
4. Atualizar `service.ts` (`toAdminModelView`, `buildModelPatch`)
5. Atualizar API routes (SELECT + INSERT/UPDATE)
6. Atualizar gateway de usage: nova `getPricingForModel` assíncrona + `fetchActiveEvolutionModel` + `syncSessionUsage` + nova assinatura de `calculateSimpleCost`
7. Atualizar camada de serviço dos workflows (`run-extraction.ts`, `run-analysis-and-adaptation.ts`) para resolver pricing antes de montar `persistExamUsage`
8. Atualizar `index.ts` do gateway (re-export de `calculateSimpleCost`)
9. Atualizar UI do formulário de modelos
10. Atualizar testes e remover `MODEL_PRICING` + função síncrona `getPricingForModel` no mesmo passo
