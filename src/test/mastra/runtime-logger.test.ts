import { describe, expect, it } from "vitest";
import { createRuntimeExecutionMetadata, createRuntimeFailure } from "@/mastra/contracts/runtime-contracts";
import { createRuntimeLogEntry } from "@/mastra/observability/runtime-logger";
import { createRequestContext } from "@/services/runtime/request-context";

describe("mastra runtime logger", () => {
  it("builds structured logs with runtime metadata", () => {
    const metadata = createRuntimeExecutionMetadata({
      correlationId: "phase7-log",
      examId: "exam-1",
      stage: "extraction",
      model: "openai/gpt-5.4",
      agentId: "extraction-agent",
      promptVersion: "extraction@v1",
    });
    const context = createRequestContext({
      correlationId: metadata.correlationId,
      requestId: "request-1",
      examId: metadata.examId,
    });

    const entry = createRuntimeLogEntry(
      "info",
      metadata,
      context,
      "Starting extraction workflow.",
    );

    expect(entry.level).toBe("info");
    expect(entry.runtime.stage).toBe("extraction");
    expect(entry.runtime.event).toBe("extraction_started");
  });

  it("marks failures with stable runtime error information", () => {
    const metadata = createRuntimeExecutionMetadata({
      correlationId: "phase7-log",
      examId: "exam-2",
      stage: "adaptation",
      model: "openai/gpt-5.4-mini",
      agentId: "adaptation-agent",
      promptVersion: "adaptation@v1",
    });
    const context = createRequestContext({
      correlationId: metadata.correlationId,
      requestId: "request-2",
      examId: metadata.examId,
    });
    const failure = createRuntimeFailure({
      stage: "adaptation",
      code: "PERSISTENCE_FAILED",
      message: "Falha ao persistir as adaptações geradas.",
      retryable: false,
    });

    const entry = createRuntimeLogEntry(
      "error",
      metadata,
      context,
      "Adaptation workflow failed.",
      failure,
    );

    expect(entry.runtime.event).toBe("adaptation_started");
    expect(entry.runtime.failureCode).toBe("PERSISTENCE_FAILED");
  });
});
