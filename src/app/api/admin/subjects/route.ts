import { withAdminRoute } from "@/app/api/admin/with-admin-route";
import { toEnabledNameEntity } from "@/features/admin/curriculum/service";
import { createEnabledNameEntitySchema } from "@/features/admin/curriculum/validation";
import { apiSuccess, apiValidationError, apiInternalError } from "@/services/errors/api-response";

export const GET = withAdminRoute(async ({ supabase }) => {
  const { data, error } = await supabase.from("subjects").select("id, name, enabled").order("name");

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess((data ?? []).map(toEnabledNameEntity));
});

export const POST = withAdminRoute(async ({ supabase }, request) => {
  const parsed = createEnabledNameEntitySchema.safeParse(await request.json());

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const { data, error } = await supabase
    .from("subjects")
    .insert({ name: parsed.data.name })
    .select("id, name, enabled")
    .single();

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess(toEnabledNameEntity(data), 201);
});
