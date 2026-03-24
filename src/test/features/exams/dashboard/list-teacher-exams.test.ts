import { describe, expect, it, vi } from "vitest";
import { listTeacherExams } from "@/features/exams/dashboard/list-teacher-exams";

describe("listTeacherExams", () => {
  it("normalizes teacher exams into the canonical dashboard view model", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "exam-1",
          topic: "Frações",
          status: "awaiting_answers",
          error_message: null,
          created_at: "2026-03-21T11:00:00.000Z",
          updated_at: "2026-03-21T11:30:00.000Z",
          subjects: { name: "Matemática" },
          grade_levels: { name: "7º ano" },
          exam_supports: [
            { supports: { name: "Dislexia" } },
            { supports: { name: "TDAH" } },
          ],
        },
      ],
      error: null,
    });

    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    const exams = await listTeacherExams({
      teacherId: "teacher-1",
      createClient: async () => ({ from }),
    });

    expect(exams).toEqual([
      {
        id: "exam-1",
        subjectName: "Matemática",
        gradeLevelName: "7º ano",
        topic: "Frações",
        supports: ["Dislexia", "TDAH"],
        status: "awaiting_answers",
        createdAt: "2026-03-21T11:00:00.000Z",
        updatedAt: "2026-03-21T11:30:00.000Z",
        errorMessage: null,
        href: "/exams/exam-1/extraction",
        statusLabel: "Aguardando respostas",
        statusTone: "outline",
      },
    ]);
  });

  it("returns an empty list when the repository has no exams", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    const exams = await listTeacherExams({
      teacherId: "teacher-1",
      createClient: async () => ({ from }),
    });

    expect(exams).toEqual([]);
  });
});
