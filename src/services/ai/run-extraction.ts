import type {
  ExtractionWorkflowInput,
  ExtractionWorkflowResult,
} from "@/mastra/contracts/extraction-contracts";
import {
  createExtractExamWorkflow,
  runExtractExamWorkflow,
} from "@/mastra/workflows/extract-exam-workflow";
import { createPrismaMastraRuntime } from "@/mastra/runtime";

type RunExtractionDependencies = Parameters<typeof createExtractExamWorkflow>[0];

export async function runExtraction(
  input: ExtractionWorkflowInput,
  dependencies: RunExtractionDependencies,
): Promise<ExtractionWorkflowResult> {
  const workflow = createExtractExamWorkflow(dependencies);
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
