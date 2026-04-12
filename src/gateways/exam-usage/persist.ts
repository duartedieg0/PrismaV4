import type { SupabaseClient } from "@supabase/supabase-js";

export async function persistExamUsage(
  supabase: SupabaseClient,
  input: {
    examId: string;
    stage: "extraction" | "adaptation";
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  },
): Promise<void> {
  await supabase
    .from("exam_usage")
    .upsert(
      {
        exam_id: input.examId,
        stage: input.stage,
        model_id: input.modelId,
        input_tokens: input.inputTokens,
        output_tokens: input.outputTokens,
        estimated_cost_usd: input.estimatedCostUsd,
      },
      { onConflict: "exam_id,stage" },
    );
}
