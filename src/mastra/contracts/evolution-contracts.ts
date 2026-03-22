import type { RuntimeExecutionMetadata, RuntimeFailure } from "@/mastra/contracts/runtime-contracts";
import type { AiModelRecord } from "@/mastra/providers/model-registry";
import type { EvolutionFeedbackView } from "@/features/admin/agents/evolution/contracts";

export interface EvolutionWorkflowInput {
  agentId: string;
  agentName: string;
  objective?: string | null;
  currentPrompt: string;
  currentVersion: number;
  initiatedBy: string;
  correlationId?: string;
  model: AiModelRecord;
  feedbacks: EvolutionFeedbackView[];
}

export interface EvolutionWorkflowSuccess {
  outcome: "success";
  metadata: RuntimeExecutionMetadata<"evolution">;
  evolutionId: string;
  originalPrompt: string;
  suggestedPrompt: string;
  commentary: string;
  currentVersion: number;
  suggestedVersion: number;
}

export interface EvolutionWorkflowFailure {
  outcome: "error";
  metadata: RuntimeExecutionMetadata<"evolution">;
  status: "error";
  failure: RuntimeFailure<"evolution">;
}

export type EvolutionWorkflowResult =
  | EvolutionWorkflowSuccess
  | EvolutionWorkflowFailure;

export function createEvolutionWorkflowInput(
  input: EvolutionWorkflowInput,
): EvolutionWorkflowInput {
  return input;
}

export function createEvolutionWorkflowSuccess(
  input: Omit<EvolutionWorkflowSuccess, "outcome">,
): EvolutionWorkflowSuccess {
  return {
    outcome: "success",
    ...input,
  };
}

export function createEvolutionWorkflowFailure(
  input: Omit<EvolutionWorkflowFailure, "outcome">,
): EvolutionWorkflowFailure {
  return {
    outcome: "error",
    ...input,
  };
}
