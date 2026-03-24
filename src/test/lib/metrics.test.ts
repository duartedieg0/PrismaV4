import { describe, expect, it, vi, beforeEach } from "vitest";
import { recordApiLatency, recordApiError } from "@/lib/metrics";

describe("recordApiLatency", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("emits a structured metric entry", () => {
    recordApiLatency("/api/exams", "POST", 201, 150);

    expect(logSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output.metric).toBe("api.latency");
    expect(output.endpoint).toBe("/api/exams");
    expect(output.method).toBe("POST");
    expect(output.status).toBe(201);
    expect(output.durationMs).toBe(150);
    expect(output.timestamp).toBeGreaterThan(0);

    logSpy.mockRestore();
  });
});

describe("recordApiError", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("emits an error metric entry", () => {
    recordApiError("/api/admin/agents", "GET", 500);

    expect(logSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output.metric).toBe("api.error");
    expect(output.endpoint).toBe("/api/admin/agents");
    expect(output.status).toBe(500);

    logSpy.mockRestore();
  });
});
