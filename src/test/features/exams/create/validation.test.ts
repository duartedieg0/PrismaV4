import { describe, expect, it } from "vitest";
import {
  CREATE_EXAM_MAX_TOPIC_LENGTH,
  CREATE_EXAM_MAX_PDF_SIZE,
  createExamInputSchema,
  validatePdfFile,
} from "@/features/exams/create/validation";

describe("create exam validation", () => {
  it("accepts a valid create-exam payload", () => {
    const result = createExamInputSchema.safeParse({
      subjectId: "550e8400-e29b-41d4-a716-446655440000",
      gradeLevelId: "550e8400-e29b-41d4-a716-446655440001",
      topic: "Frações",
      supportSelections: [{ supportId: "550e8400-e29b-41d4-a716-446655440002" }],
      uploadedPdf: {
        fileName: "avaliacao.pdf",
        fileType: "application/pdf",
        fileSize: 1024,
      },
    });

    expect(result.success).toBe(true);
  });

  it("requires subject, grade level and at least one support", () => {
    const result = createExamInputSchema.safeParse({
      subjectId: "",
      gradeLevelId: "",
      topic: "Frações",
      supportSelections: [],
      uploadedPdf: {
        fileName: "avaliacao.pdf",
        fileType: "application/pdf",
        fileSize: 1024,
      },
    });

    expect(result.success).toBe(false);
  });

  it("limits the optional topic size", () => {
    const result = createExamInputSchema.safeParse({
      subjectId: "550e8400-e29b-41d4-a716-446655440000",
      gradeLevelId: "550e8400-e29b-41d4-a716-446655440001",
      topic: "a".repeat(CREATE_EXAM_MAX_TOPIC_LENGTH + 1),
      supportSelections: [{ supportId: "550e8400-e29b-41d4-a716-446655440002" }],
      uploadedPdf: {
        fileName: "avaliacao.pdf",
        fileType: "application/pdf",
        fileSize: 1024,
      },
    });

    expect(result.success).toBe(false);
  });

  it("validates PDF presence, type and size", () => {
    expect(validatePdfFile(null)).toBe("Selecione um arquivo PDF.");

    expect(
      validatePdfFile({
        name: "avaliacao.txt",
        type: "text/plain",
        size: 100,
      }),
    ).toBe("O arquivo deve ser um PDF.");

    expect(
      validatePdfFile({
        name: "avaliacao.pdf",
        type: "application/pdf",
        size: CREATE_EXAM_MAX_PDF_SIZE + 1,
      }),
    ).toBe("O arquivo deve ter no maximo 25 MB.");
  });
});
