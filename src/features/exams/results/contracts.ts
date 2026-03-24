import type { AdaptationStatus, AdaptedAlternative, CopyableBlock } from "@/domains/adaptations/contracts";
import type { ExamStatus, QuestionAlternative, QuestionType } from "@/domains/exams/contracts";

export type ResultEventType =
  | "result_viewed"
  | "adaptation_copied"
  | "exam_copy_compiled"
  | "feedback_submitted"
  | "feedback_dismissed";

export interface FeedbackView {
  id: string;
  rating: number;
  comment: string | null;
}

export interface AdaptationResultView {
  adaptationId: string;
  supportId: string;
  supportName: string;
  status: AdaptationStatus;
  adaptedContent: string | null;
  adaptedAlternatives: AdaptedAlternative[] | null;
  bnccSkills: string[] | null;
  bloomLevel: string | null;
  bnccAnalysis: string | null;
  bloomAnalysis: string | null;
  copyBlock: CopyableBlock | null;
  feedback: FeedbackView | null;
}

export interface QuestionResultView {
  questionId: string;
  orderNum: number;
  questionType: QuestionType;
  originalContent: string;
  originalAlternatives: QuestionAlternative[] | null;
  supports: AdaptationResultView[];
}

export interface ExamResultView {
  examId: string;
  examStatus: Extract<ExamStatus, "completed">;
  subjectName: string;
  gradeLevelName: string;
  topicName: string;
  supportNames: string[];
  createdAt: string;
  questions: QuestionResultView[];
}

export interface FeedbackSubmission {
  adaptationId: string;
  rating: number;
  comment: string | null;
}

export interface CopyEvent {
  type: ResultEventType;
  examId: string;
  questionId?: string;
  adaptationId?: string;
  supportId?: string;
  copiedTextLength?: number;
}

export function createExamResultView(input: ExamResultView): ExamResultView {
  return input;
}

export function createFeedbackSubmission(
  input: FeedbackSubmission,
): FeedbackSubmission {
  return input;
}

export function createCopyEvent(input: CopyEvent): CopyEvent {
  return input;
}
