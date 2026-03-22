import { Mastra } from "@mastra/core";
import type { createAnalyzeAndAdaptWorkflow } from "@/mastra/workflows/analyze-and-adapt-workflow";
import type { createEvolveAgentWorkflow } from "@/mastra/workflows/evolve-agent-workflow";
import type { createExtractExamWorkflow } from "@/mastra/workflows/extract-exam-workflow";

type ExtractExamWorkflow = ReturnType<typeof createExtractExamWorkflow>;
type AnalyzeAndAdaptWorkflow = ReturnType<typeof createAnalyzeAndAdaptWorkflow>;
type EvolveAgentWorkflow = ReturnType<typeof createEvolveAgentWorkflow>;

export function createPrismaMastraRuntime(input: {
  extractExamWorkflow?: ExtractExamWorkflow;
  analyzeAndAdaptWorkflow?: AnalyzeAndAdaptWorkflow;
  evolveAgentWorkflow?: EvolveAgentWorkflow;
}) {
  return new Mastra({
    workflows: {
      ...(input.extractExamWorkflow ? { extractExamWorkflow: input.extractExamWorkflow } : {}),
      ...(input.analyzeAndAdaptWorkflow
        ? { analyzeAndAdaptWorkflow: input.analyzeAndAdaptWorkflow }
        : {}),
      ...(input.evolveAgentWorkflow
        ? { evolveAgentWorkflow: input.evolveAgentWorkflow }
        : {}),
    },
    logger: false,
  });
}
