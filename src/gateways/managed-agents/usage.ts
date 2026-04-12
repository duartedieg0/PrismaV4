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
