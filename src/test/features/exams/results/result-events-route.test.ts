import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const examSingle = vi.fn();
const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

vi.mock("@/gateways/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser,
    },
    from(table: string) {
      if (table === "exams") {
        return {
          select: () => ({
            eq: () => ({
              single: examSingle,
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  })),
}));

describe("result events route", () => {
  beforeEach(() => {
    getUser.mockReset();
    examSingle.mockReset();
    infoSpy.mockClear();
  });

  it("returns 401 for anonymous users", async () => {
    const { POST } = await import("@/app/api/exams/[id]/events/route");

    getUser.mockResolvedValue({
      data: { user: null },
    });

    const response = await POST(
      new Request("http://localhost:3000/api/exams/exam-1/events", {
        method: "POST",
        body: JSON.stringify({ type: "result_viewed" }),
      }),
      { params: Promise.resolve({ id: "exam-1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("accepts a copy event for an owned exam", async () => {
    const { POST } = await import("@/app/api/exams/[id]/events/route");

    getUser.mockResolvedValue({
      data: { user: { id: "teacher-1" } },
    });
    examSingle.mockResolvedValue({
      data: { id: "exam-1", user_id: "teacher-1" },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost:3000/api/exams/exam-1/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "adaptation_copied",
          examId: "exam-1",
          adaptationId: "adaptation-1",
          supportId: "support-1",
          copiedTextLength: 120,
        }),
      }),
      { params: Promise.resolve({ id: "exam-1" }) },
    );

    expect(response.status).toBe(202);
    expect(infoSpy).toHaveBeenCalled();
  });
});
