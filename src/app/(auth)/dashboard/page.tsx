import { redirect } from "next/navigation";
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { createClient } from "@/gateways/supabase/server";
import { getProfileOrRedirect } from "@/features/auth/get-profile";
import { DashboardHeader } from "@/features/exams/dashboard/components/dashboard-header";
import { ExamRepository } from "@/features/exams/dashboard/components/exam-repository";
import { ExamRepositoryEmpty } from "@/features/exams/dashboard/components/exam-repository-empty";
import { listTeacherExams } from "@/features/exams/dashboard/list-teacher-exams";

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
    createClient: async () => supabase as any,
  });

  if (profileResult.kind === "redirect") {
    redirect(profileResult.redirectTo);
  }

  const exams = await listTeacherExams({
    teacherId: profileResult.profile.id,
    createClient: async () => supabase as any,
  });

  const stats = {
    total: exams.length,
    processing: exams.filter((exam) =>
      ["uploading", "extracting", "awaiting_answers", "analyzing"].includes(exam.status),
    ).length,
    completed: exams.filter((exam) => exam.status === "completed").length,
  };

  return (
    <TeacherShell
      title="Dashboard"
      description="Acompanhe o status das provas, retome revisões pendentes e abra novas adaptações a partir da mesma área de trabalho."
      activeNav="dashboard"
      primaryAction={{ label: "Nova Prova", href: "/exams/new", ariaLabel: "Nova adaptação" }}
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Dashboard", href: "/dashboard" },
      ]}
    >
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <DashboardHeader
          teacherName={getTeacherFirstName(profileResult.profile.full_name ?? null)}
          stats={stats}
        />
        {exams.length > 0 ? <ExamRepository exams={exams} /> : <ExamRepositoryEmpty />}
      </div>
    </TeacherShell>
  );
}
