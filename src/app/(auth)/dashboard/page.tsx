import { redirect } from "next/navigation";
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { createClient } from "@/gateways/supabase/server";
import { getProfileOrRedirect } from "@/features/auth/get-profile";
import { DashboardHeader } from "@/features/exams/dashboard/components/dashboard-header";
import { ExamRepository } from "@/features/exams/dashboard/components/exam-repository";
import { ExamRepositoryEmpty } from "@/features/exams/dashboard/components/exam-repository-empty";
import { listTeacherExams } from "@/features/exams/dashboard/list-teacher-exams";
import { ProfileCompletionBanner } from "@/features/profile/components/profile-completion-banner";

type StaticPageProps = {
  params: Promise<Record<string, never>>;
};

function getTeacherFirstName(fullName: string | null) {
  return fullName?.split(" ")[0] ?? "Professor";
}

export default async function DashboardPage(_: StaticPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profileResult = await getProfileOrRedirect({
    createClient: async () => supabase,
  });

  if (profileResult.kind === "redirect") {
    redirect(profileResult.redirectTo);
  }

  const showProfileBanner = !profileResult.profile.profile_completed;

  const exams = await listTeacherExams({
    teacherId: profileResult.profile.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createClient: async () => supabase as any,
  });

  const examIds = exams.map((exam) => exam.id);

  const [{ count: questionsCount }, { count: feedbacksCount }] = await Promise.all([
    examIds.length > 0
      ? supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .in("exam_id", examIds)
      : Promise.resolve({ count: 0 }),
    examIds.length > 0
      ? supabase
          .from("feedbacks")
          .select("*, adaptations!inner(questions!inner(exam_id))", { count: "exact", head: true })
          .in("adaptations.questions.exam_id", examIds)
      : Promise.resolve({ count: 0 }),
  ]);

  const stats = {
    total: exams.length,
    questions: questionsCount ?? 0,
    feedbacks: feedbacksCount ?? 0,
  };

  return (
    <TeacherShell
      title="Início"
      description="Acompanhe o status das provas, retome revisões pendentes e abra novas adaptações."
      activeNav="dashboard"
      primaryAction={{ label: "Nova Prova", href: "/exams/new", ariaLabel: "Nova adaptação" }}
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Início", href: "/dashboard" },
      ]}
    >
      {showProfileBanner ? <ProfileCompletionBanner /> : null}
      <div className="grid gap-6">
        <DashboardHeader
          teacherName={getTeacherFirstName(profileResult.profile.full_name ?? null)}
          stats={stats}
        />
        {exams.length > 0 ? <ExamRepository exams={exams} /> : <ExamRepositoryEmpty />}
      </div>
    </TeacherShell>
  );
}
