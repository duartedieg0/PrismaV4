import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import type { TeacherExamListItem } from "@/features/exams/dashboard/contracts";
import { ExamRepository } from "@/features/exams/dashboard/components/exam-repository";

const exams: TeacherExamListItem[] = [
  {
    id: "exam-1",
    subjectName: "Matemática",
    gradeLevelName: "7º ano",
    topic: "Frações",
    supports: ["Dislexia"],
    status: "completed",
    createdAt: "2026-03-21T11:00:00.000Z",
    updatedAt: "2026-03-21T11:30:00.000Z",
    errorMessage: null,
    href: "/exams/exam-1/result",
    statusLabel: "Concluído",
    statusTone: "default",
  },
];

describe("exam repository accessibility", () => {
  it("keeps the repository accessible", async () => {
    const { container } = render(<ExamRepository exams={exams} />);

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
