import { describe, expect, it, vi } from "vitest";
import { createExam } from "@/features/exams/create/create-exam";

const validInput = {
  subjectId: "550e8400-e29b-41d4-a716-446655440000",
  gradeLevelId: "550e8400-e29b-41d4-a716-446655440001",
  topic: undefined,
  supportSelections: [{ supportId: "550e8400-e29b-41d4-a716-446655440002" }],
  uploadedPdf: {
    fileName: "avaliacao.pdf",
    fileType: "application/pdf",
    fileSize: 1024,
    fileData: new Uint8Array([1, 2, 3]),
  },
} as const;

describe("create exam integration", () => {
  it("fails fast and rolls back when the extraction trigger cannot start", async () => {
    const deleteExam = vi.fn().mockResolvedValue({ error: null });
    const deletePdf = vi.fn().mockResolvedValue({ error: null });

    await expect(
      createExam({
        actorUserId: "teacher-1",
        input: validInput,
        dependencies: {
          insertExam: vi.fn().mockResolvedValue({
            data: { id: "exam-1" },
            error: null,
          }),
          updateExam: vi.fn().mockResolvedValue({ error: null }),
          deleteExam,
          deletePdf,
          insertExamSupports: vi.fn().mockResolvedValue({ error: null }),
          uploadPdf: vi.fn().mockResolvedValue({ error: null }),
          invokeExtraction: vi.fn().mockResolvedValue({
            error: { message: "edge function unavailable" },
          }),
        },
      }),
    ).rejects.toThrow("Erro ao iniciar a extração.");

    expect(deletePdf).toHaveBeenCalledWith({
      filePath: "teacher-1/exam-1.pdf",
    });
    expect(deleteExam).toHaveBeenCalledWith({
      examId: "exam-1",
    });
  });

  it("fails fast when exam creation cannot persist the initial record", async () => {
    await expect(
      createExam({
        actorUserId: "teacher-1",
        input: validInput,
        dependencies: {
          insertExam: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "insert failed" },
          }),
          updateExam: vi.fn(),
          deleteExam: vi.fn(),
          deletePdf: vi.fn(),
          insertExamSupports: vi.fn(),
          uploadPdf: vi.fn(),
          invokeExtraction: vi.fn(),
        },
      }),
    ).rejects.toThrow("Erro ao criar exame.");
  });
});
