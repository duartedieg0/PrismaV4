import { describe, expect, it } from "vitest";
import {
  createCreateExamResult,
  type CreateExamInput,
  type CreateExamResult,
  type ExamSupportSelection,
  type UploadedPdf,
} from "@/features/exams/create/contracts";

describe("create exam contracts", () => {
  it("formalizes the input shape for a new adaptation", () => {
    const uploadedPdf: UploadedPdf = {
      fileName: "avaliacao.pdf",
      fileType: "application/pdf",
      fileSize: 1024,
    };
    const support: ExamSupportSelection = {
      supportId: "support-1",
    };
    const input: CreateExamInput = {
      subjectId: "subject-1",
      gradeLevelId: "grade-1",
      topic: "Frações",
      supportSelections: [support],
      uploadedPdf,
    };

    expect(input).toEqual({
      subjectId: "subject-1",
      gradeLevelId: "grade-1",
      topic: "Frações",
      supportSelections: [{ supportId: "support-1" }],
      uploadedPdf: {
        fileName: "avaliacao.pdf",
        fileType: "application/pdf",
        fileSize: 1024,
      },
    });
  });

  it("formalizes the service result returned after creation", () => {
    const result: CreateExamResult = createCreateExamResult({
      examId: "exam-1",
      status: "extracting",
      pdfPath: "teacher/exam-1.pdf",
    });

    expect(result).toEqual({
      examId: "exam-1",
      status: "extracting",
      pdfPath: "teacher/exam-1.pdf",
    });
  });
});
