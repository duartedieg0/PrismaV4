import type { ExamStatus, QuestionAlternative, QuestionType } from "@/domains/exams/contracts";

export type VisualElement = {
  type: string;
  description: string;
};

export type ExtractedQuestion = {
  orderNum: number;
  content: string;
  questionType: QuestionType;
  alternatives: QuestionAlternative[] | null;
  visualElements: VisualElement[] | null;
  extractionWarning: string | null;
};

export type ExtractionRequest = {
  examId: string;
  pdfPath: string;
  initiatedBy: string;
};

export type ExtractionResult = {
  outcome: "success" | "error";
  status: Extract<ExamStatus, "awaiting_answers" | "error">;
  questions: ExtractedQuestion[];
  warnings: string[];
  fatalErrorMessage: string | null;
};

export type AnswerReviewSubmission = {
  answers: Array<{
    questionId: string;
    correctAnswer: string;
  }>;
};

export function createExtractionRequest(
  request: ExtractionRequest,
): ExtractionRequest {
  return request;
}

export function createExtractionResult(
  result: ExtractionResult,
): ExtractionResult {
  return result;
}

export function createAnswerReviewSubmission(
  submission: AnswerReviewSubmission,
): AnswerReviewSubmission {
  return submission;
}
