import { describe, expect, it, vi } from "vitest";
import { listTeacherExams } from "@/features/exams/dashboard/list-teacher-exams";

describe("teacher dashboard integration", () => {
  it("queries exams scoped to the authenticated teacher and orders by most recent", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    await listTeacherExams({
      teacherId: "teacher-1",
      createClient: async () => ({ from }),
    });

    expect(from).toHaveBeenCalledWith("exams");
    expect(select).toHaveBeenCalledWith(
      "id, topic, status, error_message, created_at, updated_at, subjects(name), grade_levels(name), exam_supports(supports(name))",
    );
    expect(eq).toHaveBeenCalledWith("user_id", "teacher-1");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("preserves exam errors and tolerates missing support joins", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "exam-2",
          topic: null,
          status: "error",
          error_message: "Falha ao processar PDF.",
          created_at: "2026-03-21T11:00:00.000Z",
          updated_at: "2026-03-21T11:30:00.000Z",
          subjects: null,
          grade_levels: null,
          exam_supports: [{ supports: null }],
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

    expect(exams[0]?.supports).toEqual([]);
    expect(exams[0]?.errorMessage).toBe("Falha ao processar PDF.");
    expect(exams[0]?.statusLabel).toBe("Erro");
  });
});
