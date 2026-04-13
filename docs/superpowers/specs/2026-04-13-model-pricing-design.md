# Model Pricing Configuration

**Date:** 2026-04-13
**Status:** Approved

## Problem

Os valores de conversão de custo em `src/gateways/managed-agents/usage.ts` são hardcoded na constante `MODEL_PRICING`. Isso impede que novos modelos sejam precificados sem alteração de código, e cria uma fonte de verdade paralela ao cadastro de modelos já existente na tabela `ai_models`.

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
  ADD COLUMN input_price_per_million         NUMERIC(10,6) DEFAULT NULL,
  ADD COLUMN output_price_per_million        NUMERIC(10,6) DEFAULT NULL,
  ADD COLUMN cache_read_price_per_million    NUMERIC(10,6) DEFAULT NULL,
  ADD COLUMN cache_creation_price_per_million NUMERIC(10,6) DEFAULT NULL;
```

Colunas nullable — modelos sem preço usam fallback. Precisão `NUMERIC(10,6)` alinhada ao restante do sistema.

### Seed: popular modelos Anthropic existentes

Os valores atuais hardcoded de `MODEL_PRICING` são usados como seed para modelos já cadastrados, via migration de dados:

| model_id | input | output | cache_read | cache_creation |
|---|---|---|---|---|
| claude-sonnet-4-6 | 0.80 | 4.00 | 0.08 | 1.00 |
| claude-haiku-4-5 | 0.08 | 0.40 | 0.008 | 0.10 |
| claude-opus-4-6 | 15.00 | 75.00 | 1.50 | 18.75 |

O seed é feito via `UPDATE` condicional (só atualiza se o `model_id` bater).

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

Adicionar os 4 campos como opcionais nos schemas de criação e atualização (número positivo ou null).

## Gateway de Usage

### `src/gateways/managed-agents/usage.ts`

Substituir `getPricingForModel(modelId: string)` por:

```typescript
async function getPricingForModel(
  supabase: SupabaseClient,
  modelId: string
): Promise<ModelPricing>
```

**Lógica de resolução:**
1. Busca `ai_models` onde `model_id = modelId` e todos os 4 campos de preço são não-nulos
2. Se encontrado → retorna os preços
3. Se não → busca `ai_models` onde `is_default = true` e preços não-nulos
4. Se ainda não → lança erro (`Error: No pricing configured for model and no default model with pricing found`)

**Impacto nos callers:**

- `syncSessionUsage(anthropic, supabase, threadId, sessionId)` — já recebe `supabase`; deve resolver o pricing internamente chamando `getPricingForModel`
- `calculateSimpleCost(usage, pricing)` — muda assinatura: recebe `ModelPricing` já resolvido em vez de `modelId`. O caller (workflow de exam) resolve o pricing antes de chamar esta função.

**Remover:** a constante `MODEL_PRICING` e a função `getPricingForModel` síncrona são deletadas.

### Workflows de exam

Em `src/mastra/workflows/extract-exam-workflow.ts` e `analyze-and-adapt-workflow.ts`:

```typescript
// Antes de chamar calculateSimpleCost:
const pricing = await getPricingForModel(supabase, usage.modelId);
const cost = calculateSimpleCost(usage, pricing);
```

## UI Admin — Formulário de Modelos

Na página `src/app/(admin)/config/models/page.tsx`, adicionar seção "Precificação" ao formulário de criação e edição de modelos.

**Campos:**

| Campo | Label | Obrigatório |
|---|---|---|
| `inputPricePerMillion` | Preço por 1M tokens de entrada (USD) | Não |
| `outputPricePerMillion` | Preço por 1M tokens de saída (USD) | Não |
| `cacheReadPricePerMillion` | Preço por 1M tokens de cache lido (USD) | Não |
| `cacheCreationPricePerMillion` | Preço por 1M tokens de cache criado (USD) | Não |

**Validação visual:** exibir badge/aviso quando o modelo está `enabled = true` mas não tem preços configurados.

**Nota:** campos de cache são opcionais e relevantes apenas para providers que suportam prompt caching (ex: Anthropic). Para outros providers podem ficar em branco.

## API Routes de Modelos

- `src/app/api/admin/models/route.ts` (POST) — incluir os 4 campos no insert
- `src/app/api/admin/models/[id]/route.ts` (PATCH) — incluir os 4 campos no update

## Testes

- Atualizar `src/test/gateways/usage-pricing.test.ts`:
  - Substituir testes de `MODEL_PRICING` hardcoded por testes da função assíncrona `getPricingForModel` com mocks do Supabase
  - Testar fallback para modelo default
  - Testar erro quando nenhum modelo tem preços

## Rollout

1. Migration SQL (adicionar colunas + seed dos modelos Anthropic)
2. Atualizar contratos TypeScript
3. Atualizar gateway de usage
4. Atualizar workflows de exam
5. Atualizar API routes de modelos
6. Atualizar UI do formulário de modelos
7. Atualizar testes
8. Remover `MODEL_PRICING` hardcoded e função síncrona `getPricingForModel`
