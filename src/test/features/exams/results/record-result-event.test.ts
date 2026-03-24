import { describe, expect, it, vi } from "vitest";
import { recordResultEvent } from "@/features/exams/results/record-result-event";

describe("recordResultEvent", () => {
  it("persists an observable result event without altering the payload", async () => {
    const persistEvent = vi.fn().mockResolvedValue(undefined);

    const event = {
      type: "result_viewed" as const,
      examId: "exam-1",
    };

    await recordResultEvent(event, {
      persistEvent,
    });

    expect(persistEvent).toHaveBeenCalledWith(event);
  });

  it("swallows persistence failures to avoid breaking the teacher flow", async () => {
    await expect(
      recordResultEvent(
        {
          type: "adaptation_copied",
          examId: "exam-1",
          adaptationId: "adaptation-1",
          copiedTextLength: 120,
        },
        {
          persistEvent: vi.fn().mockRejectedValue(new Error("storage unavailable")),
        },
      ),
    ).resolves.toBeUndefined();
  });
});
