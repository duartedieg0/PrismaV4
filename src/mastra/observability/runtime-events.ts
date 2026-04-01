import type { ObservableEventName } from "@/domains/observability/contracts";
import type {
  ExamExecutionMetadata,
  ConsultantExecutionMetadata,
  RuntimeFailure,
  ExamStage,
} from "@/mastra/contracts/runtime-contracts";

export type RuntimeEventStatus = "started" | "completed" | "failed";

export interface ExamEventRecord {
  category: "workflow";
  event: ObservableEventName;
  status: RuntimeEventStatus;
  traceId: string;
  correlationId: string;
  examId: string;
  questionId?: string;
  supportId?: string;
  stage: ExamStage;
  model: string;
  agentId: string;
  promptVersion: string;
  failureCode?: string;
  failureMessage?: string;
}

export interface ConsultantEventRecord {
  category: "consultant";
  event: ObservableEventName;
  status: RuntimeEventStatus;
  traceId: string;
  correlationId: string;
  threadId: string;
  agentSlug: string;
  teacherId: string;
  model: string;
  agentId: string;
  promptVersion: string;
  failureCode?: string;
  failureMessage?: string;
}

export type RuntimeEventRecord = ExamEventRecord | ConsultantEventRecord;

function mapExamStageToEvent(
  stage: ExamStage,
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

function mapConsultantStatusToEvent(
  status: RuntimeEventStatus,
  isThreadCreation: boolean,
): ObservableEventName {
  if (isThreadCreation) return "consultant_thread_created";
  if (status === "started") return "consultant_message_sent";
  if (status === "completed") return "consultant_response_completed";
  return "consultant_response_failed";
}

export function createExamEventRecord(
  metadata: ExamExecutionMetadata,
  status: RuntimeEventStatus,
  failure?: RuntimeFailure,
): ExamEventRecord {
  return {
    category: "workflow",
    event: mapExamStageToEvent(metadata.stage, status),
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
    ...(failure ? { failureCode: failure.code, failureMessage: failure.message } : {}),
  };
}

export function createConsultantEventRecord(
  metadata: ConsultantExecutionMetadata,
  status: RuntimeEventStatus,
  isThreadCreation = false,
  failure?: RuntimeFailure,
): ConsultantEventRecord {
  return {
    category: "consultant",
    event: mapConsultantStatusToEvent(status, isThreadCreation),
    status,
    traceId: metadata.traceId,
    correlationId: metadata.correlationId,
    threadId: metadata.threadId,
    agentSlug: metadata.agentSlug,
    teacherId: metadata.teacherId,
    model: metadata.model,
    agentId: metadata.agentId,
    promptVersion: metadata.promptVersion,
    ...(failure ? { failureCode: failure.code, failureMessage: failure.message } : {}),
  };
}
