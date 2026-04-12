import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdaptationWorkflowFailure,
  AdaptationWorkflowSuccess,
} from "@/mastra/contracts/adaptation-contracts";
import {
  createAnalyzeAndAdaptWorkflow,
  runAnalyzeAndAdaptWorkflow,
} from "@/mastra/workflows/analyze-and-adapt-workflow";
import { persistExamUsage as persistExamUsageGateway } from "@/gateways/exam-usage/persist";
import { createPrismaMastraRuntime } from "@/mastra/runtime";

// Deps without persistExamUsage — service injects it internally
type RunAnalysisAndAdaptationDeps = Omit<
  Parameters<typeof createAnalyzeAndAdaptWorkflow>[0],
  "persistExamUsage"
>;

export async function runAnalysisAndAdaptation(
  input: {
    examId: string;
    initiatedBy?: string;
    correlationId?: string;
  },
  dependencies: RunAnalysisAndAdaptationDeps,
  supabase?: SupabaseClient,
): Promise<AdaptationWorkflowSuccess | AdaptationWorkflowFailure> {
  const persistFn = supabase
    ? async (usageInput: Parameters<typeof persistExamUsageGateway>[1]) => {
        try {
          await persistExamUsageGateway(supabase, usageInput);
        } catch (err) {
          console.error("[exam-usage] Failed to persist adaptation usage:", err);
        }
      }
    : undefined;

  const workflow = createAnalyzeAndAdaptWorkflow({
    ...dependencies,
    persistExamUsage: persistFn,
  });
  const mastra = createPrismaMastraRuntime({
    analyzeAndAdaptWorkflow: workflow,
  });
  const registeredWorkflow = mastra.getWorkflowById(workflow.id) as typeof workflow;
  const result = await runAnalyzeAndAdaptWorkflow(
    registeredWorkflow,
    input,
  );

  if (result.status !== "success") {
    throw new Error("Falha ao executar o workflow de adaptação.");
  }

  if (result.result.outcome === "success") {
    return {
      outcome: "success",
      metadata: result.result.metadata,
      status: "completed",
      adaptationStatus: "completed",
      processedQuestions: result.result.processedQuestions ?? 0,
      processedAdaptations: result.result.processedAdaptations ?? 0,
    };
  }

  return {
    outcome: "error",
    metadata: result.result.metadata,
    status: "error",
    failure:
      result.result.failure ?? {
        stage: "adaptation",
        code: "ADAPTATION_WORKFLOW_FAILED",
        message: "Erro ao executar o workflow de adaptação.",
        retryable: false,
      },
  };
}
