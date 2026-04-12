import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

// NOTE: Preços por 1M tokens do Claude Sonnet 4.6 — atualizar se Anthropic alterar a tabela de preços.
// Referência: https://www.anthropic.com/pricing
export const CLAUDE_PRICING = {
  inputPerMillion: 0.80,
  outputPerMillion: 4.00,
  cacheReadPerMillion: 0.08,
  cacheCreationPerMillion: 1.00,
} as const;

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

  const estimatedCostUsd =
    (inputTokens / 1_000_000) * CLAUDE_PRICING.inputPerMillion +
    (outputTokens / 1_000_000) * CLAUDE_PRICING.outputPerMillion +
    (cacheReadTokens / 1_000_000) * CLAUDE_PRICING.cacheReadPerMillion +
    (cacheCreationTokens / 1_000_000) * CLAUDE_PRICING.cacheCreationPerMillion;

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
