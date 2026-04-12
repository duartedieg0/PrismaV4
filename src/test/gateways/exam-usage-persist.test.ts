import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { persistExamUsage } from "@/gateways/exam-usage/persist";

function makeSupabase(upsertFn = vi.fn().mockResolvedValue({ error: null })) {
  return {
    from: vi.fn().mockReturnValue({
      upsert: upsertFn,
    }),
  } as unknown as SupabaseClient;
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
