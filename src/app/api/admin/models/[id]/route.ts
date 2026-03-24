import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { buildModelPatch, toAdminModelView } from "@/features/admin/models/service";
import { updateModelSchema } from "@/features/admin/models/validation";
import { createClient } from "@/gateways/supabase/server";
import { apiInternalError, apiSuccess, apiValidationError } from "@/services/errors/api-response";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const { id } = await params;
  const parsed = updateModelSchema.safeParse(await request.json());

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const supabase = await createClient();

  if (parsed.data.isDefault === true) {
    await supabase.from("ai_models").update({ is_default: false }).neq("id", id);
  }

  const { data, error } = await supabase
    .from("ai_models")
    .update(buildModelPatch(parsed.data))
    .eq("id", id)
    .select("id, name, provider, base_url, api_key, model_id, enabled, is_default, system_role, created_at")
    .single();

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess(toAdminModelView(data));
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: updatedSupports, error: updateError } = await supabase
    .from("supports")
    .update({ model_id: null, enabled: false })
    .eq("model_id", id)
    .select("id");

  if (updateError) {
    return apiInternalError(updateError.message);
  }

  const { error } = await supabase
    .from("ai_models")
    .delete()
    .eq("id", id);

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess({
    success: true,
    disabledSupports: updatedSupports?.length ?? 0,
  });
}
