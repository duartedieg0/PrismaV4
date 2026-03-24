import { describe, expect, it, vi } from "vitest";
import { createExam } from "@/features/exams/create/create-exam";

const validInput = {
  subjectId: "550e8400-e29b-41d4-a716-446655440000",
  gradeLevelId: "550e8400-e29b-41d4-a716-446655440001",
  topic: "Frações",
  supportSelections: [
    { supportId: "550e8400-e29b-41d4-a716-446655440002" },
    { supportId: "550e8400-e29b-41d4-a716-446655440003" },
  ],
  uploadedPdf: {
    fileName: "avaliacao.pdf",
    fileType: "application/pdf",
    fileSize: 1024,
    fileData: new Uint8Array([1, 2, 3]),
  },
} as const;

describe("createExam", () => {
  it("creates the exam, uploads the PDF, persists supports and triggers extraction", async () => {
    const insertExam = vi.fn().mockResolvedValue({
      data: { id: "exam-1" },
      error: null,
    });
    const updateExam = vi.fn().mockResolvedValue({ error: null });
    const deleteExam = vi.fn().mockResolvedValue({ error: null });
    const deletePdf = vi.fn().mockResolvedValue({ error: null });
    const insertExamSupports = vi.fn().mockResolvedValue({ error: null });
    const uploadPdf = vi.fn().mockResolvedValue({ error: null });
    const invokeExtraction = vi.fn().mockResolvedValue({ error: null });

    const result = await createExam({
      actorUserId: "teacher-1",
      input: validInput,
      dependencies: {
          insertExam,
          updateExam,
          deleteExam,
          deletePdf,
          insertExamSupports,
          uploadPdf,
          invokeExtraction,
      },
    });

    expect(insertExam).toHaveBeenCalledWith({
      userId: "teacher-1",
      subjectId: validInput.subjectId,
      gradeLevelId: validInput.gradeLevelId,
      topic: "Frações",
      status: "uploading",
    });
    expect(uploadPdf).toHaveBeenCalledWith({
      filePath: "teacher-1/exam-1.pdf",
      fileData: validInput.uploadedPdf.fileData,
      contentType: "application/pdf",
    });
    expect(insertExamSupports).toHaveBeenCalledWith({
      examId: "exam-1",
      supportIds: [
        "550e8400-e29b-41d4-a716-446655440002",
        "550e8400-e29b-41d4-a716-446655440003",
      ],
    });
    expect(updateExam).toHaveBeenCalledWith({
      examId: "exam-1",
      patch: {
        pdfPath: "teacher-1/exam-1.pdf",
        status: "extracting",
      },
    });
    expect(invokeExtraction).toHaveBeenCalledWith({
      examId: "exam-1",
      initiatedBy: "teacher-1",
      pdfPath: "teacher-1/exam-1.pdf",
      pdfData: validInput.uploadedPdf.fileData,
      contentType: "application/pdf",
    });
    expect(deleteExam).not.toHaveBeenCalled();
    expect(deletePdf).not.toHaveBeenCalled();
    expect(result).toEqual({
      examId: "exam-1",
      status: "extracting",
      pdfPath: "teacher-1/exam-1.pdf",
    });
  });

  it("deletes the exam record when the upload fails", async () => {
    const insertExam = vi.fn().mockResolvedValue({
      data: { id: "exam-1" },
      error: null,
    });
    const deleteExam = vi.fn().mockResolvedValue({ error: null });
    const deletePdf = vi.fn().mockResolvedValue({ error: null });

    await expect(
      createExam({
        actorUserId: "teacher-1",
        input: validInput,
        dependencies: {
          insertExam,
          updateExam: vi.fn(),
          deleteExam,
          deletePdf,
          insertExamSupports: vi.fn(),
          uploadPdf: vi.fn().mockResolvedValue({
            error: { message: "storage unavailable" },
          }),
          invokeExtraction: vi.fn(),
        },
      }),
    ).rejects.toThrow("Erro no upload do PDF.");

    expect(deleteExam).toHaveBeenCalledWith({
      examId: "exam-1",
    });
    expect(deletePdf).not.toHaveBeenCalled();
  });

  it("rolls back the uploaded pdf and exam when support persistence fails", async () => {
    const insertExam = vi.fn().mockResolvedValue({
      data: { id: "exam-1" },
      error: null,
    });
    const deleteExam = vi.fn().mockResolvedValue({ error: null });
    const deletePdf = vi.fn().mockResolvedValue({ error: null });

    await expect(
      createExam({
        actorUserId: "teacher-1",
        input: validInput,
        dependencies: {
          insertExam,
          updateExam: vi.fn(),
          deleteExam,
          deletePdf,
          insertExamSupports: vi.fn().mockResolvedValue({
            error: { message: "insert support failed" },
          }),
          uploadPdf: vi.fn().mockResolvedValue({ error: null }),
          invokeExtraction: vi.fn(),
        },
      }),
    ).rejects.toThrow("Erro ao salvar os apoios do exame.");

    expect(deletePdf).toHaveBeenCalledWith({
      filePath: "teacher-1/exam-1.pdf",
    });
    expect(deleteExam).toHaveBeenCalledWith({
      examId: "exam-1",
    });
  });
});
