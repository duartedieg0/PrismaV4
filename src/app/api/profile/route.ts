import { createClient } from "@/gateways/supabase/server";
import { profileFormSchema } from "@/domains/profile/validation";
import { saveProfile } from "@/features/profile/save-profile";
import {
  apiSuccess,
  apiValidationError,
  apiUnauthorized,
  apiInternalError,
} from "@/services/errors/api-response";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiUnauthorized();
  }

  const parsed = profileFormSchema.safeParse(await request.json());

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  try {
    const result = await saveProfile(supabase, user.id, parsed.data);
    return apiSuccess({ profileCompleted: result.profileCompleted });
  } catch (error) {
    return apiInternalError(
      error instanceof Error ? error.message : "Erro ao salvar perfil.",
    );
  }
}
