import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { buildModelPatch, toAdminModelView } from "@/features/admin/models/service";
import { updateModelSchema } from "@/features/admin/models/validation";
import { createClient } from "@/gateways/supabase/server";

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
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toAdminModelView(data));
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
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error } = await supabase
    .from("ai_models")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    disabledSupports: updatedSupports?.length ?? 0,
  });
}
