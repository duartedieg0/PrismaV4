import { describe, expect, it } from "vitest";
import { createRequestContext } from "@/services/runtime/request-context";
import {
  createObservableEvent,
  createStructuredLogEntry,
} from "@/services/observability/logger";

describe("structured logger", () => {
  it("includes correlation and entity ids in structured log entries", () => {
    const context = createRequestContext({
      correlationId: "corr-1",
      requestId: "req-1",
      examId: "exam-1",
      workflowId: "workflow-1",
    });

    expect(
      createStructuredLogEntry({
        level: "info",
        message: "Exam extraction started",
        context,
      }),
    ).toEqual({
      level: "info",
      message: "Exam extraction started",
      metadata: {
        correlationId: "corr-1",
        requestId: "req-1",
        examId: "exam-1",
        workflowId: "workflow-1",
      },
    });
  });

  it("builds observable events from the required lifecycle names", () => {
    const context = createRequestContext({
      correlationId: "corr-2",
      examId: "exam-99",
    });

    expect(
      createObservableEvent({
        category: "exam",
        event: "upload_started",
        context,
      }),
    ).toEqual({
      category: "exam",
      event: "upload_started",
      correlationId: "corr-2",
      examId: "exam-99",
    });
  });
});
