import { describe, expect, it, vi } from "vitest";
import { createRequestContext } from "@/services/runtime/request-context";
import {
  createObservableEvent,
  createStructuredLogEntry,
  logInfo,
  logWarn,
  logError,
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

  it("logInfo writes structured JSON to console.log", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const context = createRequestContext({ examId: "exam-1" });

    logInfo("test message", context);

    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.level).toBe("info");
    expect(output.message).toBe("test message");
    expect(output.metadata.examId).toBe("exam-1");
    spy.mockRestore();
  });

  it("logWarn writes structured JSON to console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const context = createRequestContext();

    logWarn("warning message", context);

    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.level).toBe("warn");
    spy.mockRestore();
  });

  it("logError writes structured JSON with error details to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const context = createRequestContext({ examId: "exam-2" });

    logError("something failed", context, new Error("db connection refused"));

    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.level).toBe("error");
    expect(output.message).toBe("something failed");
    expect(output.error.name).toBe("Error");
    expect(output.error.message).toBe("db connection refused");
    expect(output.error.stack).toBeDefined();
    spy.mockRestore();
  });

  it("logError handles non-Error objects", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const context = createRequestContext();

    logError("something failed", context, "string error");

    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.error.raw).toBe("string error");
    spy.mockRestore();
  });

  it("logError works without error parameter", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const context = createRequestContext();

    logError("generic failure", context);

    const output = JSON.parse(spy.mock.calls[0][0] as string);
    expect(output.level).toBe("error");
    expect(output.error).toBeUndefined();
    spy.mockRestore();
  });
});
