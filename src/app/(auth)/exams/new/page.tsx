import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { ErrorState } from "@/design-system/components/error-state";
import { NewExamForm } from "@/features/exams/create/components/new-exam-form";
import { createClient } from "@/gateways/supabase/server";

type SelectOption = {
  id: string;
  name: string;
};

async function loadOptions() {
  const supabase = await createClient();
  const [subjectsResponse, gradeLevelsResponse, supportsResponse] = await Promise.all([
    supabase.from("subjects").select("id, name").eq("enabled", true).order("name"),
    supabase.from("grade_levels").select("id, name").eq("enabled", true).order("name"),
    supabase.from("supports").select("id, name").eq("enabled", true).order("name"),
  ]);

  const loadError = subjectsResponse.error ?? gradeLevelsResponse.error ?? supportsResponse.error;

  return {
    subjects: (subjectsResponse.data ?? []) as SelectOption[],
    gradeLevels: (gradeLevelsResponse.data ?? []) as SelectOption[],
    supports: (supportsResponse.data ?? []) as SelectOption[],
    loadError: loadError?.message ?? null,
  };
}

export default async function NewExamPage() {
  const { subjects, gradeLevels, supports, loadError } = await loadOptions();

  return (
    <TeacherShell
      title="Nova adaptação"
      description="Início"
      activeNav="new-exam"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Nova adaptação", href: "/exams/new" },
      ]}
    >
      {loadError ? (
        <ErrorState message="Não foi possível carregar disciplinas, séries e apoios agora." />
      ) : (
        <NewExamForm
          subjects={subjects}
          gradeLevels={gradeLevels}
          supports={supports}
        />
      )}
    </TeacherShell>
  );
}
