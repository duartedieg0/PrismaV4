export const EXAM_STATUSES = [
  "uploading",
  "extracting",
  "awaiting_answers",
  "analyzing",
  "completed",
  "error",
] as const;

export type ExamStatus = (typeof EXAM_STATUSES)[number];

export const DEFAULT_EXAM_STATUS: ExamStatus = EXAM_STATUSES[0];

export function getDefaultExamStatus(): ExamStatus {
  return DEFAULT_EXAM_STATUS;
}

export const QUESTION_TYPES = ["objective", "essay"] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const DEFAULT_QUESTION_TYPE: QuestionType = QUESTION_TYPES[0];

export function getDefaultQuestionType(): QuestionType {
  return DEFAULT_QUESTION_TYPE;
}

export interface Exam {
  id: string;
  user_id: string;
  subject_id: string;
  grade_level_id: string;
  topic: string | null;
  pdf_path: string;
  status: ExamStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamWithJoins extends Exam {
  subjects: { name: string } | null;
  grade_levels: { name: string } | null;
}

export interface QuestionAlternative {
  label: string;
  text: string;
}

export interface QuestionVisualElement {
  type: string;
  url: string;
}

export interface Question {
  id: string;
  exam_id: string;
  order_num: number;
  content: string;
  question_type: QuestionType;
  alternatives: QuestionAlternative[] | null;
  correct_answer: string | null;
  visual_elements: QuestionVisualElement[] | null;
  extraction_warning: string | null;
  created_at: string;
}

const EXAM_STATUS_DISPLAY = {
  uploading: { label: "Processando", variant: "secondary" },
  extracting: { label: "Processando", variant: "secondary" },
  awaiting_answers: { label: "Aguardando respostas", variant: "outline" },
  analyzing: { label: "Adaptando", variant: "secondary" },
  completed: { label: "Concluído", variant: "default" },
  error: { label: "Erro", variant: "destructive" },
} as const satisfies Record<
  ExamStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
>;

export function getExamStatusDisplay(status: ExamStatus) {
  return EXAM_STATUS_DISPLAY[status];
}

export function getExamRoute(examId: string, status: ExamStatus): string {
  switch (status) {
    case "awaiting_answers":
      return `/exams/${examId}/extraction`;
    case "completed":
      return `/exams/${examId}/result`;
    case "uploading":
    case "extracting":
    case "analyzing":
    case "error":
    default:
      return `/exams/${examId}/processing`;
  }
}
