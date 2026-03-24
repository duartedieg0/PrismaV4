import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: vi.fn() };
});

const getUser = vi.fn();
const createExam = vi.fn();

vi.mock("@/gateways/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser,
    },
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  })),
}));

vi.mock("@/features/exams/create/create-exam", () => ({
  createExam,
}));

describe("exams route", () => {
  beforeEach(() => {
    getUser.mockReset();
    createExam.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns 401 when the user is not authenticated", async () => {
    const { POST } = await import("@/app/api/exams/route");

    getUser.mockResolvedValue({
      data: { user: null },
    });

    const response = await POST(
      new Request("http://localhost:3000/api/exams", {
        method: "POST",
        body: new FormData(),
      }),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 when the multipart payload is invalid", async () => {
    const { POST } = await import("@/app/api/exams/route");
    const formData = new FormData();

    getUser.mockResolvedValue({
      data: {
        user: {
          id: "teacher-1",
          email: "teacher@example.com",
        },
      },
    });

    formData.append("subjectId", "invalid");
    formData.append("gradeLevelId", "invalid");
    formData.append("supportIds", "not-json");

    const response = await POST({
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 201 and the exam id when creation succeeds", async () => {
    const { POST } = await import("@/app/api/exams/route");
    const uploadedFile = {
      name: "avaliacao.pdf",
      type: "application/pdf",
      size: 3,
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([112, 100, 102]).buffer),
    };

    getUser.mockResolvedValue({
      data: {
        user: {
          id: "teacher-1",
          email: "teacher@example.com",
        },
      },
    });
    createExam.mockResolvedValue({
      examId: "exam-123",
      status: "extracting",
      pdfPath: "teacher-1/exam-123.pdf",
    });

    const response = await POST({
      formData: vi.fn().mockResolvedValue({
        get: (field: string) => {
          switch (field) {
            case "file":
              return uploadedFile;
            case "subjectId":
              return "550e8400-e29b-41d4-a716-446655440000";
            case "gradeLevelId":
              return "550e8400-e29b-41d4-a716-446655440001";
            case "topic":
              return "Frações";
            case "supportIds":
              return JSON.stringify(["550e8400-e29b-41d4-a716-446655440002"]);
            default:
              return null;
          }
        },
      }),
    } as unknown as Request);

    expect(createExam).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "teacher-1",
        input: expect.objectContaining({
          subjectId: "550e8400-e29b-41d4-a716-446655440000",
          gradeLevelId: "550e8400-e29b-41d4-a716-446655440001",
          topic: "Frações",
          supportSelections: [{ supportId: "550e8400-e29b-41d4-a716-446655440002" }],
          uploadedPdf: expect.objectContaining({
            fileName: "avaliacao.pdf",
            fileType: "application/pdf",
          }),
        }),
      }),
    );
    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body.data.examId).toBe("exam-123");
  });
});
