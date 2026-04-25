import type { ProfileFormInput } from "@/domains/profile/validation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = { from: (...args: any[]) => any };

export async function saveProfile(
  supabase: SupabaseLike,
  userId: string,
  input: ProfileFormInput,
) {
  const profileCompleted = Boolean(
    input.phone?.trim() && input.city?.trim() && input.state?.trim(),
  );

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name || null,
      phone: input.phone || null,
      bio: input.bio || null,
      state: input.state || null,
      city: input.city || null,
      schools: input.schools || null,
      years_experience: input.years_experience,
      academic_background: input.academic_background || null,
      profile_completed: profileCompleted,
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  // Sync profile_subjects: delete all, then re-insert
  // Note: Supabase JS client does not support transactions. If insert fails
  // after delete, the user loses associations. This is acceptable for profile
  // data — the user can simply re-save. A Supabase RPC function wrapping this
  // in a SQL transaction can be added later if needed.
  await supabase.from("profile_subjects").delete().eq("profile_id", userId);

  if (input.subject_ids.length > 0) {
    const { error: subjectsError } = await supabase.from("profile_subjects").insert(
      input.subject_ids.map((subjectId) => ({
        profile_id: userId,
        subject_id: subjectId,
      })),
    );

    if (subjectsError) {
      throw new Error(subjectsError.message);
    }
  }

  // Sync profile_grade_levels: delete all, then re-insert (same caveat as above)
  await supabase.from("profile_grade_levels").delete().eq("profile_id", userId);

  if (input.grade_level_ids.length > 0) {
    const { error: gradeLevelsError } = await supabase.from("profile_grade_levels").insert(
      input.grade_level_ids.map((gradeLevelId) => ({
        profile_id: userId,
        grade_level_id: gradeLevelId,
      })),
    );

    if (gradeLevelsError) {
      throw new Error(gradeLevelsError.message);
    }
  }

  return { profileCompleted };
}
