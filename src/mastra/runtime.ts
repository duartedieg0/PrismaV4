import { Mastra } from "@mastra/core";
import { ConsoleLogger, type LogLevel } from "@mastra/core/logger";
import type { createAnalyzeAndAdaptWorkflow } from "@/mastra/workflows/analyze-and-adapt-workflow";
import type { createEvolveAgentWorkflow } from "@/mastra/workflows/evolve-agent-workflow";
import type { createExtractExamWorkflow } from "@/mastra/workflows/extract-exam-workflow";

type ExtractExamWorkflow = ReturnType<typeof createExtractExamWorkflow>;
type AnalyzeAndAdaptWorkflow = ReturnType<typeof createAnalyzeAndAdaptWorkflow>;
type EvolveAgentWorkflow = ReturnType<typeof createEvolveAgentWorkflow>;

const VALID_LOG_LEVELS = new Set<string>(["debug", "info", "warn", "error", "silent"]);

function resolveMastraLogLevel(): LogLevel {
  const env = process.env.MASTRA_LOG_LEVEL ?? "info";
  return VALID_LOG_LEVELS.has(env) ? (env as LogLevel) : "info";
}

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
    logger: new ConsoleLogger({
      name: "prisma-mastra",
      level: resolveMastraLogLevel(),
    }),
  });
}
