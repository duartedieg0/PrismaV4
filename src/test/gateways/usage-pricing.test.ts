// src/test/gateways/usage-pricing.test.ts
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPricingForModel, calculateSimpleCost } from "@/gateways/managed-agents/usage";

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
      null,
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
    expect(cost).toBeCloseTo(4.80);
  });

  it("calcula custo corretamente com pricing de haiku", () => {
    const pricing = {
      inputPerMillion: 0.08,
      outputPerMillion: 0.40,
      cacheReadPerMillion: 0.008,
      cacheCreationPerMillion: 0.10,
    };
    const cost = calculateSimpleCost({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, pricing);
    expect(cost).toBeCloseTo(0.48);
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
