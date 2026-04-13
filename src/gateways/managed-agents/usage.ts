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
