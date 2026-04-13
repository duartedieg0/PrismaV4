import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ExtractionWorkflowInput,
  ExtractionWorkflowResult,
} from "@/mastra/contracts/extraction-contracts";
import {
  createExtractExamWorkflow,
  runExtractExamWorkflow,
} from "@/mastra/workflows/extract-exam-workflow";
import { persistExamUsage as persistExamUsageGateway } from "@/gateways/exam-usage/persist";
import { getPricingForModel, calculateSimpleCost } from "@/gateways/managed-agents/usage";
import { createPrismaMastraRuntime } from "@/mastra/runtime";

type RunExtractionDeps = Omit<
  Parameters<typeof createExtractExamWorkflow>[0],
  "persistExamUsage"
>;

// Tipo do input que o workflow passa para persistExamUsage (sem estimatedCostUsd)
type WorkflowUsageInput = {
  examId: string;
  stage: "extraction" | "adaptation";
  modelId: string;
  inputTokens: number;
  outputTokens: number;
};

export async function runExtraction(
  input: ExtractionWorkflowInput,
  dependencies: RunExtractionDeps,
  supabase?: SupabaseClient,
): Promise<ExtractionWorkflowResult> {
  const persistFn = supabase
    ? async (usageInput: WorkflowUsageInput) => {
        try {
          const pricing = await getPricingForModel(supabase, usageInput.modelId);
          const estimatedCostUsd = calculateSimpleCost(usageInput, pricing);
          await persistExamUsageGateway(supabase, { ...usageInput, estimatedCostUsd });
        } catch (err) {
          console.error("[exam-usage] Failed to persist extraction usage:", err);
        }
      }
    : undefined;

  const workflow = createExtractExamWorkflow({
    ...dependencies,
    persistExamUsage: persistFn,
  });
  const mastra = createPrismaMastraRuntime({
    extractExamWorkflow: workflow,
  });
  const registeredWorkflow = mastra.getWorkflowById(workflow.id) as typeof workflow;
  const result = await runExtractExamWorkflow(registeredWorkflow, input);

  if (result.status !== "success") {
    throw new Error("Falha ao executar o workflow de extração.");
  }

  return result.result as ExtractionWorkflowResult;
}
