import {
  getExamRoute,
  getExamStatusDisplay,
  type ExamStatus,
} from "@/domains/exams/contracts";

export type TeacherExamStatus = ExamStatus;

export type TeacherExamListItem = {
  id: string;
  subjectName: string;
  gradeLevelName: string;
  topic: string;
  supports: string[];
  status: TeacherExamStatus;
  createdAt: string;
  updatedAt: string;
  errorMessage: string | null;
  href: string;
  statusLabel: string;
  statusTone: "default" | "secondary" | "destructive" | "outline";
};

type CreateTeacherExamListItemInput = {
  id: string;
  subjectName: string | null;
  gradeLevelName: string | null;
  topic: string | null;
  supports: string[];
  status: TeacherExamStatus;
  createdAt: string;
  updatedAt: string;
  errorMessage: string | null;
};

export function createTeacherExamListItem(
  input: CreateTeacherExamListItemInput,
): TeacherExamListItem {
  const statusDisplay = getExamStatusDisplay(input.status);

  return {
    id: input.id,
    subjectName: input.subjectName ?? "Disciplina não informada",
    gradeLevelName: input.gradeLevelName ?? "Série não informada",
    topic: input.topic ?? "Sem tema definido",
    supports: input.supports,
    status: input.status,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    errorMessage: input.errorMessage,
    href: getExamRoute(input.id, input.status),
    statusLabel: statusDisplay.label,
    statusTone: statusDisplay.variant,
  };
}
