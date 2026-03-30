import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useExamProgress } from "@/features/exams/results/hooks/use-exam-progress";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

const initialData = {
  status: "extracting" as const,
  errorMessage: null,
  progress: { total: 0, completed: 0, questionsCount: 0, questionsCompleted: 0 },
};

function mockFetchResponse(data: unknown) {
  (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    }),
  );
}

describe("useExamProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pushMock.mockReset();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initialData on first render without fetching", () => {
    const { result } = renderHook(() => useExamProgress("exam-1", initialData));

    expect(result.current.status).toBe("extracting");
    expect(result.current.isPolling).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("polls the status endpoint after the interval", async () => {
    mockFetchResponse({
      data: {
        status: "analyzing",
        errorMessage: null,
        progress: { total: 10, completed: 3, questionsCount: 5, questionsCompleted: 1 },
      },
    });

    const { result } = renderHook(() => useExamProgress("exam-1", initialData));

    // Advance timer and flush all microtasks (promises)
    await act(async () => {
      vi.advanceTimersByTime(4000);
      // Let all promises (fetch, json) settle
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe("analyzing");
    expect(result.current.progress.questionsCompleted).toBe(1);
  });

  it("stops polling and redirects on completed status", async () => {
    mockFetchResponse({
      data: {
        status: "completed",
        errorMessage: null,
        progress: { total: 10, completed: 10, questionsCount: 5, questionsCompleted: 5 },
      },
    });

    const { result } = renderHook(() => useExamProgress("exam-1", initialData));

    await act(async () => {
      vi.advanceTimersByTime(4000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe("completed");
    expect(result.current.isPolling).toBe(false);

    // After the 1s redirect delay
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(pushMock).toHaveBeenCalledWith("/exams/exam-1/result");
  });

  it("stops polling and redirects on awaiting_answers status", async () => {
    mockFetchResponse({
      data: {
        status: "awaiting_answers",
        errorMessage: null,
        progress: { total: 0, completed: 0, questionsCount: 5, questionsCompleted: 0 },
      },
    });

    renderHook(() => useExamProgress("exam-1", initialData));

    await act(async () => {
      vi.advanceTimersByTime(4000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(pushMock).toHaveBeenCalledWith("/exams/exam-1/extraction");
  });

  it("stops polling on error status", async () => {
    mockFetchResponse({
      data: {
        status: "error",
        errorMessage: "Something failed",
        progress: { total: 0, completed: 0, questionsCount: 0, questionsCompleted: 0 },
      },
    });

    const { result } = renderHook(() => useExamProgress("exam-1", initialData));

    await act(async () => {
      vi.advanceTimersByTime(4000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorMessage).toBe("Something failed");
    expect(result.current.isPolling).toBe(false);
  });
});
