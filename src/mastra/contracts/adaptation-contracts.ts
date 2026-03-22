import type { AdaptationStatus } from "@/domains/adaptations/contracts";
import type { ExamStatus } from "@/domains/exams/contracts";
import type { RuntimeExecutionMetadata, RuntimeFailure } from "@/mastra/contracts/runtime-contracts";

export interface AdaptationWorkflowInput {
  examId: string;
  initiatedBy: string;
  questionIds: string[];
  supportIds: string[];
  correlationId?: string;
}

export interface AdaptationWorkflowSuccess {
  outcome: "success";
  metadata: RuntimeExecutionMetadata;
  status: Extract<ExamStatus, "completed">;
  adaptationStatus: Extract<AdaptationStatus, "completed">;
  processedQuestions: number;
  processedAdaptations: number;
}

export interface AdaptationWorkflowFailure {
  outcome: "error";
  metadata: RuntimeExecutionMetadata;
  status: Extract<ExamStatus, "error">;
  failure: RuntimeFailure;
}

export type AdaptationWorkflowResult =
  | AdaptationWorkflowSuccess
  | AdaptationWorkflowFailure;

export function createAdaptationWorkflowInput(
  input: AdaptationWorkflowInput,
): AdaptationWorkflowInput {
  return input;
}

export function createAdaptationWorkflowSuccess(
  input: Omit<AdaptationWorkflowSuccess, "outcome">,
): AdaptationWorkflowSuccess {
  return {
    outcome: "success",
    ...input,
  };
}

export function createAdaptationWorkflowFailure(
  input: Omit<AdaptationWorkflowFailure, "outcome">,
): AdaptationWorkflowFailure {
  return {
    outcome: "error",
    ...input,
  };
}
