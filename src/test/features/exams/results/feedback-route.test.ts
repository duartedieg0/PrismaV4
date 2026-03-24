import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const examSingle = vi.fn();
const feedbackMaybeSingle = vi.fn();
const feedbackUpdateSingle = vi.fn();
const feedbackInsertSingle = vi.fn();

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

      if (table === "feedbacks") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: feedbackMaybeSingle,
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: feedbackUpdateSingle,
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: feedbackInsertSingle,
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  })),
}));

describe("feedback route", () => {
  beforeEach(() => {
    getUser.mockReset();
    examSingle.mockReset();
    feedbackMaybeSingle.mockReset();
    feedbackUpdateSingle.mockReset();
    feedbackInsertSingle.mockReset();
  });

  it("returns 401 for anonymous users", async () => {
    const { POST } = await import("@/app/api/exams/[id]/feedback/route");

    getUser.mockResolvedValue({
      data: { user: null },
    });

    const response = await POST(
      new Request("http://localhost:3000/api/exams/exam-1/feedback", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "exam-1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 when payload is invalid", async () => {
    const { POST } = await import("@/app/api/exams/[id]/feedback/route");

    getUser.mockResolvedValue({
      data: { user: { id: "teacher-1" } },
    });
    examSingle.mockResolvedValue({
      data: { id: "exam-1", user_id: "teacher-1" },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost:3000/api/exams/exam-1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adaptationId: "invalid",
          rating: 9,
        }),
      }),
      { params: Promise.resolve({ id: "exam-1" }) },
    );

    expect(response.status).toBe(400);
  });

  it("updates an existing feedback row", async () => {
    const { POST } = await import("@/app/api/exams/[id]/feedback/route");

    getUser.mockResolvedValue({
      data: { user: { id: "teacher-1" } },
    });
    examSingle.mockResolvedValue({
      data: { id: "exam-1", user_id: "teacher-1" },
      error: null,
    });
    feedbackMaybeSingle.mockResolvedValue({
      data: { id: "feedback-1" },
      error: null,
    });
    feedbackUpdateSingle.mockResolvedValue({
      data: { id: "feedback-1", rating: 4, comment: "Ficou útil." },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost:3000/api/exams/exam-1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adaptationId: "550e8400-e29b-41d4-a716-446655440002",
          rating: 4,
          comment: "Ficou útil.",
        }),
      }),
      { params: Promise.resolve({ id: "exam-1" }) },
    );

    expect(response.status).toBe(200);
  });

  it("creates a feedback row when one does not exist", async () => {
    const { POST } = await import("@/app/api/exams/[id]/feedback/route");

    getUser.mockResolvedValue({
      data: { user: { id: "teacher-1" } },
    });
    examSingle.mockResolvedValue({
      data: { id: "exam-1", user_id: "teacher-1" },
      error: null,
    });
    feedbackMaybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });
    feedbackInsertSingle.mockResolvedValue({
      data: { id: "feedback-2", rating: 5, comment: null },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost:3000/api/exams/exam-1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adaptationId: "550e8400-e29b-41d4-a716-446655440002",
          rating: 5,
        }),
      }),
      { params: Promise.resolve({ id: "exam-1" }) },
    );

    expect(response.status).toBe(201);
  });
});
