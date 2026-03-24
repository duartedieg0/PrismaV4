import type { ExamStatus } from "@/domains/exams/contracts";
import type { RuntimeExecutionMetadata, RuntimeFailure } from "@/mastra/contracts/runtime-contracts";

export interface ExtractionWorkflowInput {
  examId: string;
  initiatedBy: string;
  pdfPath: string;
  correlationId?: string;
}

export interface ExtractionWorkflowSuccess {
  outcome: "success";
  metadata: RuntimeExecutionMetadata;
  status: Extract<ExamStatus, "awaiting_answers">;
  warnings: string[];
  questionsCount: number;
}

export interface ExtractionWorkflowFailure {
  outcome: "error";
  metadata: RuntimeExecutionMetadata;
  status: Extract<ExamStatus, "error">;
  failure: RuntimeFailure;
}

export type ExtractionWorkflowResult =
  | ExtractionWorkflowSuccess
  | ExtractionWorkflowFailure;

export function createExtractionWorkflowInput(
  input: ExtractionWorkflowInput,
): ExtractionWorkflowInput {
  return input;
}

export function createExtractionWorkflowSuccess(
  input: Omit<ExtractionWorkflowSuccess, "outcome">,
): ExtractionWorkflowSuccess {
  return {
    outcome: "success",
    ...input,
  };
}

export function createExtractionWorkflowFailure(
  input: Omit<ExtractionWorkflowFailure, "outcome">,
): ExtractionWorkflowFailure {
  return {
    outcome: "error",
    ...input,
  };
}
