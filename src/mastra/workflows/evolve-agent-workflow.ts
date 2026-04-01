import { z } from "zod";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import {
  createEvolutionWorkflowFailure,
  createEvolutionWorkflowSuccess,
} from "@/mastra/contracts/evolution-contracts";
import {
  createExamExecutionMetadata,
  createRuntimeFailure,
} from "@/mastra/contracts/runtime-contracts";
import { createExamEventRecord } from "@/mastra/observability/runtime-events";
import { EVOLUTION_PROMPT_VERSION, buildEvolutionPrompt } from "@/mastra/prompts/evolution-prompt";
import type { AiModelRecord } from "@/mastra/providers/model-registry";

const feedbackSchema = z.object({
  id: z.string(),
  rating: z.number(),
  comment: z.string().nullable(),
  createdAt: z.string(),
  originalContent: z.string(),
  adaptedContent: z.string().nullable(),
  supportName: z.string(),
  dismissed: z.boolean(),
  usedInEvolution: z.boolean(),
});

const modelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  modelId: z.string(),
  baseUrl: z.string(),
  apiKey: z.string(),
  enabled: z.boolean(),
  isDefault: z.boolean(),
});

const evolveAgentInputSchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
  objective: z.string().nullable().optional(),
  currentPrompt: z.string(),
  currentVersion: z.number(),
  initiatedBy: z.string(),
  correlationId: z.string().optional(),
  model: modelSchema,
  feedbacks: z.array(feedbackSchema).min(1),
});

const evolveAgentOutputSchema = z.object({
  outcome: z.enum(["success", "error"]),
  metadata: z.object({
    traceId: z.string(),
    correlationId: z.string(),
    examId: z.string(),
    stage: z.enum(["evolution"]),
    model: z.string(),
    agentId: z.string(),
    promptVersion: z.string(),
    startedAt: z.string(),
  }),
  evolutionId: z.string().optional(),
  originalPrompt: z.string().optional(),
  suggestedPrompt: z.string().optional(),
  commentary: z.string().optional(),
  currentVersion: z.number().optional(),
  suggestedVersion: z.number().optional(),
  status: z.enum(["error"]).optional(),
  failure: z.object({
    stage: z.enum(["evolution"]),
    code: z.string(),
    message: z.string(),
    retryable: z.boolean(),
  }).optional(),
});

type EvolveAgentDependencies = {
  runEvolution(input: {
    prompt: string;
    model: AiModelRecord;
  }): Promise<{
    suggestedPrompt: string;
    commentary: string;
  }>;
  persistEvolution(input: {
    agentId: string;
    originalPrompt: string;
    suggestedPrompt: string;
    commentary: string;
    feedbackIds: string[];
    currentVersion: number;
    suggestedVersion: number;
    initiatedBy: string;
    modelId: string;
    promptVersion: string;
  }): Promise<{
    evolutionId: string;
  }>;
  registerEvent?(event: ReturnType<typeof createExamEventRecord>): Promise<void> | void;
};

export function createEvolveAgentWorkflow(dependencies: EvolveAgentDependencies) {
  const executeStep = createStep({
    id: "execute-agent-evolution",
    inputSchema: evolveAgentInputSchema,
    outputSchema: evolveAgentOutputSchema,
    execute: async ({ inputData }) => {
      const metadata = {
        ...createExamExecutionMetadata({
          correlationId: inputData.correlationId,
          examId: `agent:${inputData.agentId}`,
          stage: "evolution",
          model: `${inputData.model.provider}/${inputData.model.modelId}`,
          agentId: inputData.agentId,
          promptVersion: EVOLUTION_PROMPT_VERSION,
        }),
        stage: "evolution" as const,
      };

      await dependencies.registerEvent?.(
        createExamEventRecord(metadata, "started"),
      );

      try {
        const suggestion = await dependencies.runEvolution({
          prompt: buildEvolutionPrompt({
            agentName: inputData.agentName,
            objective: inputData.objective,
            currentPrompt: inputData.currentPrompt,
            feedbacks: inputData.feedbacks,
          }),
          model: inputData.model,
        });

        const suggestedVersion = inputData.currentVersion + 1;
        const persisted = await dependencies.persistEvolution({
          agentId: inputData.agentId,
          originalPrompt: inputData.currentPrompt,
          suggestedPrompt: suggestion.suggestedPrompt,
          commentary: suggestion.commentary,
          feedbackIds: inputData.feedbacks.map((feedback) => feedback.id),
          currentVersion: inputData.currentVersion,
          suggestedVersion,
          initiatedBy: inputData.initiatedBy,
          modelId: inputData.model.id,
          promptVersion: EVOLUTION_PROMPT_VERSION,
        });

        await dependencies.registerEvent?.(
          createExamEventRecord(metadata, "completed"),
        );

        return createEvolutionWorkflowSuccess({
          metadata,
          evolutionId: persisted.evolutionId,
          originalPrompt: inputData.currentPrompt,
          suggestedPrompt: suggestion.suggestedPrompt,
          commentary: suggestion.commentary,
          currentVersion: inputData.currentVersion,
          suggestedVersion,
        });
      } catch {
        const failure = createRuntimeFailure({
          stage: "evolution",
          code: "EVOLUTION_RUNTIME_FAILED",
          message: "Erro ao executar o workflow de evolução.",
          retryable: false,
        });

        await dependencies.registerEvent?.(
          createExamEventRecord(metadata, "failed", failure),
        );

        return createEvolutionWorkflowFailure({
          metadata,
          status: "error",
          failure,
        });
      }
    },
  });

  return createWorkflow({
    id: "evolve-agent-workflow",
    inputSchema: evolveAgentInputSchema,
    outputSchema: evolveAgentOutputSchema,
  })
    .then(executeStep)
    .commit();
}

export async function runEvolveAgentWorkflow(
  workflow: ReturnType<typeof createEvolveAgentWorkflow>,
  inputData: z.infer<typeof evolveAgentInputSchema>,
) {
  const run = await workflow.createRun();
  return run.start({ inputData });
}
