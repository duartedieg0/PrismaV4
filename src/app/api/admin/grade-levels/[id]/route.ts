import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { toEnabledNameEntity } from "@/features/admin/curriculum/service";
import { updateEnabledEntitySchema } from "@/features/admin/curriculum/validation";
import { createClient } from "@/gateways/supabase/server";
import { apiSuccess, apiValidationError, apiInternalError, apiConflict } from "@/services/errors/api-response";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const parsed = updateEnabledEntitySchema.safeParse(await request.json());

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grade_levels")
    .update({ enabled: parsed.data.enabled })
    .eq("id", id)
    .select("id, name, enabled")
    .single();

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess(toEnabledNameEntity(data));
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const { id } = await params;
  const supabase = await createClient();
  const { count } = await supabase
    .from("exams")
    .select("id", { count: "exact", head: true })
    .eq("grade_level_id", id);

  if ((count ?? 0) > 0) {
    return apiConflict("Anos/Séries já usados em provas devem ser desabilitados, não excluídos.");
  }

  const { error } = await supabase.from("grade_levels").delete().eq("id", id);

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess({ success: true });
}
