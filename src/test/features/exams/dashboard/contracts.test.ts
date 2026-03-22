import { describe, expect, it } from "vitest";
import {
  createTeacherExamListItem,
  type TeacherExamListItem,
} from "@/features/exams/dashboard/contracts";
import { getExamRoute, getExamStatusDisplay } from "@/domains/exams/contracts";

describe("teacher dashboard contracts", () => {
  it("defines the supported repository statuses through the centralized exam contract", () => {
    expect(getExamStatusDisplay("uploading")).toEqual({
      label: "Processando",
      variant: "secondary",
    });
    expect(getExamStatusDisplay("awaiting_answers")).toEqual({
      label: "Aguardando respostas",
      variant: "outline",
    });
    expect(getExamStatusDisplay("completed")).toEqual({
      label: "Concluído",
      variant: "default",
    });
    expect(getExamRoute("exam-1", "error")).toBe("/exams/exam-1/processing");
    expect(getExamRoute("exam-1", "completed")).toBe("/exams/exam-1/result");
  });

  it("creates the canonical dashboard item including selected supports", () => {
    const item = createTeacherExamListItem({
      id: "exam-1",
      subjectName: "Matemática",
      gradeLevelName: "7º ano",
      topic: "Frações",
      supports: ["Dislexia", "TDAH"],
      status: "awaiting_answers",
      createdAt: "2026-03-21T10:00:00.000Z",
      updatedAt: "2026-03-21T11:00:00.000Z",
      errorMessage: null,
    });

    expect(item).toEqual<TeacherExamListItem>({
      id: "exam-1",
      subjectName: "Matemática",
      gradeLevelName: "7º ano",
      topic: "Frações",
      supports: ["Dislexia", "TDAH"],
      status: "awaiting_answers",
      createdAt: "2026-03-21T10:00:00.000Z",
      updatedAt: "2026-03-21T11:00:00.000Z",
      errorMessage: null,
      href: "/exams/exam-1/extraction",
      statusLabel: "Aguardando respostas",
      statusTone: "outline",
    });
  });

  it("applies deterministic fallbacks when metadata is missing", () => {
    const item = createTeacherExamListItem({
      id: "exam-2",
      subjectName: null,
      gradeLevelName: null,
      topic: null,
      supports: [],
      status: "error",
      createdAt: "2026-03-21T10:00:00.000Z",
      updatedAt: "2026-03-21T11:00:00.000Z",
      errorMessage: "Falha ao processar PDF.",
    });

    expect(item.subjectName).toBe("Disciplina não informada");
    expect(item.gradeLevelName).toBe("Série não informada");
    expect(item.topic).toBe("Sem tema definido");
    expect(item.supports).toEqual([]);
    expect(item.href).toBe("/exams/exam-2/processing");
    expect(item.statusLabel).toBe("Erro");
    expect(item.errorMessage).toBe("Falha ao processar PDF.");
  });
});
