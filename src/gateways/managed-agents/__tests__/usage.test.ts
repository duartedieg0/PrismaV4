import { describe, it, expect, vi, beforeEach } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { syncSessionUsage, CLAUDE_PRICING } from "../usage";

const mockSessionRetrieve = vi.fn();

const mockAnthropicClient = {
  beta: {
    sessions: {
      retrieve: mockSessionRetrieve,
    },
  },
} as unknown as Anthropic;

function makeSupabaseMock() {
  const mockEq = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
  return {
    supabase: { from: mockFrom } as unknown as SupabaseClient,
    mockFrom,
    mockUpdate,
    mockEq,
  };
}

describe("CLAUDE_PRICING", () => {
  it("deve definir os 4 tipos de preço", () => {
    expect(CLAUDE_PRICING.inputPerMillion).toBe(3.00);
    expect(CLAUDE_PRICING.outputPerMillion).toBe(15.00);
    expect(CLAUDE_PRICING.cacheReadPerMillion).toBe(0.30);
    expect(CLAUDE_PRICING.cacheCreationPerMillion).toBe(3.75);
  });
});

describe("syncSessionUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve calcular custo correto para 1M de cada tipo de token", async () => {
    mockSessionRetrieve.mockResolvedValue({
      usage: {
        input_tokens: 1_000_000,
        output_tokens: 1_000_000,
        cache_read_input_tokens: 1_000_000,
        cache_creation_input_tokens: 1_000_000,
      },
    });
    const { supabase, mockUpdate } = makeSupabaseMock();

    await syncSessionUsage(mockAnthropicClient, supabase, "thread-1", "sess-1");

    const updateArg = mockUpdate.mock.calls[0][0];
    // 3.00 + 15.00 + 0.30 + 3.75 = 22.05
    expect(updateArg.estimated_cost_usd).toBeCloseTo(22.05, 5);
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
    const { supabase, mockFrom, mockUpdate, mockEq } = makeSupabaseMock();

    await syncSessionUsage(mockAnthropicClient, supabase, "thread-abc", "sess-abc");

    expect(mockFrom).toHaveBeenCalledWith("consultant_threads");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        total_input_tokens: 5000,
        total_output_tokens: 3200,
        total_cache_read_tokens: 20000,
        total_cache_creation_tokens: 2000,
      }),
    );
    expect(mockEq).toHaveBeenCalledWith("id", "thread-abc");
  });

  it("deve definir last_usage_sync_at como ISO string recente", async () => {
    mockSessionRetrieve.mockResolvedValue({ usage: {} });
    const { supabase, mockUpdate } = makeSupabaseMock();

    const before = Date.now();
    await syncSessionUsage(mockAnthropicClient, supabase, "thread-1", "sess-1");
    const after = Date.now();

    const updateArg = mockUpdate.mock.calls[0][0];
    const syncedAt = new Date(updateArg.last_usage_sync_at).getTime();
    expect(syncedAt).toBeGreaterThanOrEqual(before);
    expect(syncedAt).toBeLessThanOrEqual(after);
  });

  it("deve tratar usage ausente como zeros", async () => {
    mockSessionRetrieve.mockResolvedValue({});
    const { supabase, mockUpdate } = makeSupabaseMock();

    await syncSessionUsage(mockAnthropicClient, supabase, "thread-1", "sess-1");

    const updateArg = mockUpdate.mock.calls[0][0];
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
