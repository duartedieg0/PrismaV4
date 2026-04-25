import { redirect } from "next/navigation";
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { createClient } from "@/gateways/supabase/server";
import { getFullProfile } from "@/features/profile/get-full-profile";
import { ProfileForm } from "@/features/profile/components/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getFullProfile(supabase, user.id);

  if (!data) {
    redirect("/login?error=missing_profile");
  }

  return (
    <TeacherShell
      title="Meu Perfil"
      description="Atualize suas informacoes pessoais e profissionais."
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Meu Perfil", href: "/profile" },
      ]}
    >
      <ProfileForm
        profile={data.profile}
        subjects={data.subjects}
        gradeLevels={data.gradeLevels}
        selectedSubjectIds={data.selectedSubjectIds}
        selectedGradeLevelIds={data.selectedGradeLevelIds}
      />
    </TeacherShell>
  );
}
