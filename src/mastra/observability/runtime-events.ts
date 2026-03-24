import type { ObservableEventName } from "@/domains/observability/contracts";
import type { RuntimeExecutionMetadata, RuntimeFailure } from "@/mastra/contracts/runtime-contracts";

export type RuntimeEventStatus = "started" | "completed" | "failed";

export interface RuntimeEventRecord {
  category: "workflow";
  event: ObservableEventName;
  status: RuntimeEventStatus;
  traceId: string;
  correlationId: string;
  examId: string;
  questionId?: string;
  supportId?: string;
  stage: RuntimeExecutionMetadata["stage"];
  model: string;
  agentId: string;
  promptVersion: string;
  failureCode?: string;
  failureMessage?: string;
}

function mapStageToEvent(
  stage: RuntimeExecutionMetadata["stage"],
  status: RuntimeEventStatus,
): ObservableEventName {
  if (stage === "extraction") {
    return status === "completed" ? "extraction_completed" : "extraction_started";
  }

  if (stage === "evolution") {
    return status === "completed"
      ? "agent_evolution_completed"
      : "agent_evolution_started";
  }

  return status === "completed" ? "adaptation_completed" : "adaptation_started";
}

export function createRuntimeEventRecord(
  metadata: RuntimeExecutionMetadata,
  status: RuntimeEventStatus,
  failure?: RuntimeFailure,
): RuntimeEventRecord {
  return {
    category: "workflow",
    event: mapStageToEvent(metadata.stage, status),
    status,
    traceId: metadata.traceId,
    correlationId: metadata.correlationId,
    examId: metadata.examId,
    questionId: metadata.questionId,
    supportId: metadata.supportId,
    stage: metadata.stage,
    model: metadata.model,
    agentId: metadata.agentId,
    promptVersion: metadata.promptVersion,
    ...(failure
      ? {
          failureCode: failure.code,
          failureMessage: failure.message,
        }
      : {}),
  };
}
