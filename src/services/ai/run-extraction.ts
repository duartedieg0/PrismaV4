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
import { createPrismaMastraRuntime } from "@/mastra/runtime";

// Deps without persistExamUsage — service injects it internally
type RunExtractionDeps = Omit<
  Parameters<typeof createExtractExamWorkflow>[0],
  "persistExamUsage"
>;

export async function runExtraction(
  input: ExtractionWorkflowInput,
  dependencies: RunExtractionDeps,
  supabase?: SupabaseClient,
): Promise<ExtractionWorkflowResult> {
  const persistFn = supabase
    ? async (usageInput: Parameters<typeof persistExamUsageGateway>[1]) => {
        try {
          await persistExamUsageGateway(supabase, usageInput);
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
  const result = await runExtractExamWorkflow(
    registeredWorkflow,
    input,
  );

  if (result.status !== "success") {
    throw new Error("Falha ao executar o workflow de extração.");
  }

  return result.result as ExtractionWorkflowResult;
}
