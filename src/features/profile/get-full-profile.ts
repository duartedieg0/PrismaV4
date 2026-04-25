import type { FullProfile, SelectOption } from "@/domains/profile/contracts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = { from: (...args: any[]) => any };

type GetFullProfileResult = {
  profile: FullProfile;
  subjects: SelectOption[];
  gradeLevels: SelectOption[];
  selectedSubjectIds: string[];
  selectedGradeLevelIds: string[];
};

export async function getFullProfile(
  supabase: SupabaseLike,
  userId: string,
): Promise<GetFullProfileResult | null> {
  const [profileResult, subjectsResult, gradeLevelsResult, profileSubjectsResult, profileGradeLevelsResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, avatar_url, phone, bio, state, city, schools, years_experience, academic_background, profile_completed",
        )
        .eq("id", userId)
        .single(),
      supabase.from("subjects").select("id, name").eq("enabled", true).order("name"),
      supabase.from("grade_levels").select("id, name").eq("enabled", true).order("name"),
      supabase.from("profile_subjects").select("subject_id").eq("profile_id", userId),
      supabase.from("profile_grade_levels").select("grade_level_id").eq("profile_id", userId),
    ]);

  if (!profileResult.data) {
    return null;
  }

  return {
    profile: profileResult.data as FullProfile,
    subjects: (subjectsResult.data ?? []) as SelectOption[],
    gradeLevels: (gradeLevelsResult.data ?? []) as SelectOption[],
    selectedSubjectIds: (profileSubjectsResult.data ?? []).map(
      (row: { subject_id: string }) => row.subject_id,
    ),
    selectedGradeLevelIds: (profileGradeLevelsResult.data ?? []).map(
      (row: { grade_level_id: string }) => row.grade_level_id,
    ),
  };
}
