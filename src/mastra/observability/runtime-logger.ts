import { createStructuredLogEntry } from "@/services/observability/logger";
import type { RequestContext } from "@/services/runtime/request-context";
import type { ExamExecutionMetadata, RuntimeFailure } from "@/mastra/contracts/runtime-contracts";
import { createExamEventRecord } from "@/mastra/observability/runtime-events";

type RuntimeLogLevel = "info" | "warn" | "error";

export function createRuntimeLogEntry(
  level: RuntimeLogLevel,
  metadata: ExamExecutionMetadata,
  context: RequestContext,
  message: string,
  failure?: RuntimeFailure,
) {
  return {
    ...createStructuredLogEntry({
      level,
      message,
      context,
    }),
    runtime: createExamEventRecord(
      metadata,
      failure ? "failed" : level === "warn" ? "completed" : "started",
      failure,
    ),
  };
}
