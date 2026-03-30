import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const examSingle = vi.fn();
const questionsEq = vi.fn();
const adaptationsSelect = vi.fn();
const adaptationsIn = vi.fn();
const adaptationsEq = vi.fn();

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

      if (table === "questions") {
        return {
          select: () => ({
            eq: questionsEq,
          }),
        };
      }

      if (table === "adaptations") {
        return {
          select: adaptationsSelect,
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  })),
}));

describe("exam status route", () => {
  beforeEach(() => {
    getUser.mockReset();
    examSingle.mockReset();
    questionsEq.mockReset();
    adaptationsSelect.mockReset();
    adaptationsIn.mockReset();
    adaptationsEq.mockReset();
  });

  it("returns 401 for anonymous users", async () => {
    const { GET } = await import("@/app/api/exams/[id]/status/route");

    getUser.mockResolvedValue({
      data: { user: null },
    });

    const response = await GET(new Request("http://localhost:3000/api/exams/exam-1/status"), {
      params: Promise.resolve({ id: "exam-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 403 when the exam does not belong to the authenticated teacher", async () => {
    const { GET } = await import("@/app/api/exams/[id]/status/route");

    getUser.mockResolvedValue({
      data: { user: { id: "teacher-1" } },
    });
    examSingle.mockResolvedValue({
      data: { id: "exam-1", user_id: "teacher-2", status: "extracting", error_message: null },
      error: null,
    });

    const response = await GET(new Request("http://localhost:3000/api/exams/exam-1/status"), {
      params: Promise.resolve({ id: "exam-1" }),
    });

    expect(response.status).toBe(403);
  });

  it("returns stable exam status and progress payload", async () => {
    const { GET } = await import("@/app/api/exams/[id]/status/route");

    getUser.mockResolvedValue({
      data: { user: { id: "teacher-1" } },
    });
    examSingle.mockResolvedValue({
      data: { id: "exam-1", user_id: "teacher-1", status: "analyzing", error_message: null },
      error: null,
    });
    questionsEq.mockResolvedValue({
      data: [{ id: "question-1" }, { id: "question-2" }],
      error: null,
    });
    adaptationsSelect
      .mockReturnValueOnce({
        in: adaptationsIn.mockResolvedValueOnce({ count: 4, error: null }),
      })
      .mockReturnValueOnce({
        in: vi.fn(() => ({
          eq: adaptationsEq.mockResolvedValue({
            count: 2,
            error: null,
          }),
        })),
      })
      .mockReturnValueOnce({
        in: vi.fn().mockResolvedValue({
          data: [
            { question_id: "question-1", status: "completed" },
            { question_id: "question-1", status: "pending" },
            { question_id: "question-2", status: "completed" },
            { question_id: "question-2", status: "pending" },
          ],
          error: null,
        }),
      });

    const response = await GET(new Request("http://localhost:3000/api/exams/exam-1/status"), {
      params: Promise.resolve({ id: "exam-1" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual({
      status: "analyzing",
      errorMessage: null,
      progress: {
        total: 4,
        completed: 2,
        questionsCount: 2,
        questionsCompleted: 0,
      },
    });
  });

  it("counts questionsCompleted when all adaptations for a question are done", async () => {
    const { GET } = await import("@/app/api/exams/[id]/status/route");

    getUser.mockResolvedValue({ data: { user: { id: "teacher-1" } } });
    examSingle.mockResolvedValue({
      data: { id: "exam-1", user_id: "teacher-1", status: "analyzing", error_message: null },
      error: null,
    });
    questionsEq.mockResolvedValue({
      data: [{ id: "question-1" }, { id: "question-2" }],
      error: null,
    });
    adaptationsSelect
      .mockReturnValueOnce({
        in: adaptationsIn.mockResolvedValueOnce({ count: 4, error: null }),
      })
      .mockReturnValueOnce({
        in: vi.fn(() => ({
          eq: adaptationsEq.mockResolvedValue({ count: 3, error: null }),
        })),
      })
      .mockReturnValueOnce({
        in: vi.fn().mockResolvedValue({
          data: [
            { question_id: "question-1", status: "completed" },
            { question_id: "question-1", status: "completed" },
            { question_id: "question-2", status: "completed" },
            { question_id: "question-2", status: "pending" },
          ],
          error: null,
        }),
      });

    const response = await GET(new Request("http://localhost:3000/api/exams/exam-1/status"), {
      params: Promise.resolve({ id: "exam-1" }),
    });

    const body = await response.json();
    expect(body.data.progress.questionsCompleted).toBe(1);
  });

  it("includes questionsCompleted in zero-questions early return", async () => {
    const { GET } = await import("@/app/api/exams/[id]/status/route");

    getUser.mockResolvedValue({ data: { user: { id: "teacher-1" } } });
    examSingle.mockResolvedValue({
      data: { id: "exam-1", user_id: "teacher-1", status: "extracting", error_message: null },
      error: null,
    });
    questionsEq.mockResolvedValue({ data: [], error: null });

    const response = await GET(new Request("http://localhost:3000/api/exams/exam-1/status"), {
      params: Promise.resolve({ id: "exam-1" }),
    });

    const body = await response.json();
    expect(body.data.progress).toEqual({
      total: 0,
      completed: 0,
      questionsCount: 0,
      questionsCompleted: 0,
    });
  });
});
