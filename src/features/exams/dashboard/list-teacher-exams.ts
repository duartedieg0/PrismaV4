import { createTeacherExamListItem, type TeacherExamListItem } from "@/features/exams/dashboard/contracts";

type ExamRow = {
  id: string;
  topic: string | null;
  status: TeacherExamListItem["status"];
  error_message: string | null;
  created_at: string;
  updated_at: string;
  subjects: { name: string } | null;
  grade_levels: { name: string } | null;
  exam_supports: Array<{ supports: { name: string } | null }> | null;
};

type ListTeacherExamsOptions = {
  teacherId: string;
  createClient: () => Promise<{
    from(table: "exams"): {
      select(query: string): {
        eq(column: "user_id", value: string): {
          order(
            column: "created_at",
            options: { ascending: false },
          ): Promise<{
            data: ExamRow[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  }>;
};

const DASHBOARD_EXAM_SELECT =
  "id, topic, status, error_message, created_at, updated_at, subjects(name), grade_levels(name), exam_supports(supports(name))";

export async function listTeacherExams({
  teacherId,
  createClient,
}: ListTeacherExamsOptions): Promise<TeacherExamListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exams")
    .select(DASHBOARD_EXAM_SELECT)
    .eq("user_id", teacherId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((exam) =>
    createTeacherExamListItem({
      id: exam.id,
      subjectName: exam.subjects?.name ?? null,
      gradeLevelName: exam.grade_levels?.name ?? null,
      topic: exam.topic,
      supports:
        exam.exam_supports?.flatMap((record) =>
          record.supports?.name ? [record.supports.name] : [],
        ) ?? [],
      status: exam.status,
      createdAt: exam.created_at,
      updatedAt: exam.updated_at,
      errorMessage: exam.error_message,
    }),
  );
}

export { DASHBOARD_EXAM_SELECT };
