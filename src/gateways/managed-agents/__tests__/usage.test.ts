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

function makeSupabaseMock(modelRow = SONNET_ROW) {
  const mockThreadEq = vi.fn().mockResolvedValue({ error: null });
  const mockThreadUpdate = vi.fn().mockReturnValue({ eq: mockThreadEq });

  // For getPricingForModel: .select(...).eq(...).single()
  const mockSingle = vi.fn().mockResolvedValue({ data: modelRow, error: null });
  const mockPricingEq = vi.fn().mockReturnValue({ single: mockSingle });

  // For fetchActiveEvolutionModel: await supabase.from("ai_models").select(...)
  // This returns a thenable that resolves with { data: [modelRow] }
  const aiModelsSelectResult = {
    eq: mockPricingEq,
    then(resolve: (v: { data: unknown[]; error: null }) => unknown) {
      return Promise.resolve({ data: [modelRow], error: null }).then(resolve);
    },
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
