import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const examSingle = vi.fn();
const questionUpdateEq = vi.fn();
const examUpdateEq = vi.fn();
const runAnalysisAndAdaptation = vi.fn();

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
          update: () => ({
            eq: examUpdateEq,
          }),
        };
      }

      if (table === "questions") {
        return {
          update: () => ({
            eq() {
              return {
                eq: questionUpdateEq,
              };
            },
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  })),
}));

vi.mock("@/services/ai/run-analysis-and-adaptation", () => ({
  runAnalysisAndAdaptation,
}));

describe("submit answers route", () => {
  beforeEach(() => {
    getUser.mockReset();
    examSingle.mockReset();
    questionUpdateEq.mockReset();
    examUpdateEq.mockReset();
    runAnalysisAndAdaptation.mockReset();
  });

  it("returns 401 for anonymous users", async () => {
    const { POST } = await import("@/app/api/exams/[id]/answers/route");

    getUser.mockResolvedValue({
      data: { user: null },
    });

    const response = await POST(
      new Request("http://localhost:3000/api/exams/exam-1/answers", {
        method: "POST",
        body: JSON.stringify({ answers: [] }),
      }),
      { params: Promise.resolve({ id: "exam-1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 when the payload is invalid", async () => {
    const { POST } = await import("@/app/api/exams/[id]/answers/route");

    getUser.mockResolvedValue({
      data: { user: { id: "teacher-1" } },
    });
    examSingle.mockResolvedValue({
      data: { id: "exam-1", user_id: "teacher-1", status: "awaiting_answers" },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost:3000/api/exams/exam-1/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [{ questionId: "invalid", correctAnswer: "B" }],
        }),
      }),
      { params: Promise.resolve({ id: "exam-1" }) },
    );

    expect(response.status).toBe(400);
  });

  it("persists answers, moves the exam to analyzing and triggers the next stage", async () => {
    const { POST } = await import("@/app/api/exams/[id]/answers/route");

    getUser.mockResolvedValue({
      data: { user: { id: "teacher-1" } },
    });
    examSingle.mockResolvedValue({
      data: { id: "exam-1", user_id: "teacher-1", status: "awaiting_answers" },
      error: null,
    });
    questionUpdateEq.mockResolvedValue({ error: null });
    examUpdateEq.mockResolvedValue({ error: null });
    runAnalysisAndAdaptation.mockResolvedValue({
      outcome: "success",
      metadata: {
        traceId: "trace-1",
        correlationId: "corr-1",
        examId: "exam-1",
        stage: "adaptation",
        model: "openai/gpt-5.4",
        agentId: "adaptation-agent",
        promptVersion: "adaptation@v1",
        startedAt: new Date().toISOString(),
      },
      status: "completed",
      adaptationStatus: "completed",
      processedQuestions: 1,
      processedAdaptations: 1,
    });

    const response = await POST(
      new Request("http://localhost:3000/api/exams/exam-1/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [
            {
              questionId: "550e8400-e29b-41d4-a716-446655440002",
              correctAnswer: "B",
            },
          ],
        }),
      }),
      { params: Promise.resolve({ id: "exam-1" }) },
    );

    expect(questionUpdateEq).toHaveBeenCalledWith("exam_id", "exam-1");
    expect(examUpdateEq).toHaveBeenCalledWith("id", "exam-1");
    expect(runAnalysisAndAdaptation).toHaveBeenCalledWith(
      expect.objectContaining({
        examId: "exam-1",
        initiatedBy: "teacher-1",
      }),
      expect.objectContaining({
        loadExamContext: expect.any(Function),
        persistAdaptation: expect.any(Function),
      }),
    );
    expect(response.status).toBe(200);
  });

  it("returns 500 when the adaptation workflow finishes in error", async () => {
    const { POST } = await import("@/app/api/exams/[id]/answers/route");

    getUser.mockResolvedValue({
      data: { user: { id: "teacher-1" } },
    });
    examSingle.mockResolvedValue({
      data: { id: "exam-1", user_id: "teacher-1", status: "awaiting_answers" },
      error: null,
    });
    questionUpdateEq.mockResolvedValue({ error: null });
    examUpdateEq.mockResolvedValue({ error: null });
    runAnalysisAndAdaptation.mockResolvedValue({
      outcome: "error",
      metadata: {
        traceId: "trace-1",
        correlationId: "corr-1",
        examId: "exam-1",
        stage: "adaptation",
        model: "openai/gpt-5.4",
        agentId: "adaptation-agent",
        promptVersion: "adaptation@v1",
        startedAt: new Date().toISOString(),
      },
      status: "error",
      failure: {
        stage: "adaptation",
        code: "ADAPTATION_WORKFLOW_FAILED",
        message: "Erro ao executar o workflow de adaptação.",
        retryable: false,
      },
    });

    const response = await POST(
      new Request("http://localhost:3000/api/exams/exam-1/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [
            {
              questionId: "550e8400-e29b-41d4-a716-446655440002",
              correctAnswer: "B",
            },
          ],
        }),
      }),
      { params: Promise.resolve({ id: "exam-1" }) },
    );

    expect(response.status).toBe(500);
  });
});
