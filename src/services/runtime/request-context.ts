import type {
  LogSafeMetadata,
  ObservableEntityIds,
} from "@/domains/observability/contracts";
import { normalizeCorrelationId } from "@/services/runtime/correlation-id";

export interface RequestContext extends ObservableEntityIds {
  correlationId: string;
}

export interface RequestContextInput {
  correlationId?: string | null;
  requestId?: string | null;
  examId?: string | null;
  questionId?: string | null;
  adaptationId?: string | null;
  workflowId?: string | null;
}

function normalizeId(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function createRequestContext(
  context: RequestContextInput = {},
): RequestContext {
  return {
    correlationId: normalizeCorrelationId(context.correlationId),
    requestId: normalizeId(context.requestId),
    examId: normalizeId(context.examId),
    questionId: normalizeId(context.questionId),
    adaptationId: normalizeId(context.adaptationId),
    workflowId: normalizeId(context.workflowId),
  };
}

export function toLogSafeMetadata(context: RequestContext): LogSafeMetadata {
  const metadata: LogSafeMetadata = {
    correlationId: context.correlationId,
  };

  if (context.requestId) {
    metadata.requestId = context.requestId;
  }

  if (context.examId) {
    metadata.examId = context.examId;
  }

  if (context.questionId) {
    metadata.questionId = context.questionId;
  }

  if (context.adaptationId) {
    metadata.adaptationId = context.adaptationId;
  }

  if (context.workflowId) {
    metadata.workflowId = context.workflowId;
  }

  return metadata;
}
