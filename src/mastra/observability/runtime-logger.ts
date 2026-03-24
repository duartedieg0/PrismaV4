import { createStructuredLogEntry } from "@/services/observability/logger";
import type { RequestContext } from "@/services/runtime/request-context";
import type { RuntimeExecutionMetadata, RuntimeFailure } from "@/mastra/contracts/runtime-contracts";
import { createRuntimeEventRecord } from "@/mastra/observability/runtime-events";

type RuntimeLogLevel = "info" | "warn" | "error";

export function createRuntimeLogEntry(
  level: RuntimeLogLevel,
  metadata: RuntimeExecutionMetadata,
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
    runtime: createRuntimeEventRecord(
      metadata,
      failure ? "failed" : level === "warn" ? "completed" : "started",
      failure,
    ),
  };
}
