import type {
  AdaptationWorkflowFailure,
  AdaptationWorkflowSuccess,
} from "@/mastra/contracts/adaptation-contracts";
import {
  createAnalyzeAndAdaptWorkflow,
  runAnalyzeAndAdaptWorkflow,
} from "@/mastra/workflows/analyze-and-adapt-workflow";
import { createPrismaMastraRuntime } from "@/mastra/runtime";

type RunAnalysisAndAdaptationDependencies = Parameters<
  typeof createAnalyzeAndAdaptWorkflow
>[0];

export async function runAnalysisAndAdaptation(
  input: {
    examId: string;
    initiatedBy?: string;
    correlationId?: string;
  },
  dependencies: RunAnalysisAndAdaptationDependencies,
): Promise<AdaptationWorkflowSuccess | AdaptationWorkflowFailure> {
  const workflow = createAnalyzeAndAdaptWorkflow(dependencies);
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
