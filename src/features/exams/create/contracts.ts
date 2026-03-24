import type { ExamStatus } from "@/domains/exams/contracts";

export type UploadedPdf = {
  fileName: string;
  fileType: string;
  fileSize: number;
};

export type ExamSupportSelection = {
  supportId: string;
};

export type CreateExamInput = {
  subjectId: string;
  gradeLevelId: string;
  topic?: string;
  supportSelections: readonly ExamSupportSelection[];
  uploadedPdf: UploadedPdf;
};

export type CreateExamResult = {
  examId: string;
  status: ExamStatus;
  pdfPath: string;
};

export function createCreateExamResult(
  result: CreateExamResult,
): CreateExamResult {
  return result;
}
