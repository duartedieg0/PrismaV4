import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { createModelSchema } from "@/features/admin/models/validation";
import { toAdminModelView } from "@/features/admin/models/service";
import { createClient } from "@/gateways/supabase/server";

export async function GET() {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_models")
    .select("id, name, provider, base_url, api_key, model_id, enabled, is_default, system_role, created_at")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map(toAdminModelView));
}

export async function POST(request: Request) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const parsed = createModelSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = await createClient();

  if (parsed.data.isDefault) {
    await supabase.from("ai_models").update({ is_default: false }).neq("id", "");
  }

  const { data, error } = await supabase
    .from("ai_models")
    .insert({
      name: parsed.data.name,
      provider: parsed.data.provider,
      base_url: parsed.data.baseUrl,
      api_key: parsed.data.apiKey,
      model_id: parsed.data.modelId,
      enabled: parsed.data.enabled ?? true,
      is_default: parsed.data.isDefault ?? false,
      system_role: parsed.data.systemRole ?? null,
    })
    .select("id, name, provider, base_url, api_key, model_id, enabled, is_default, system_role, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toAdminModelView(data), { status: 201 });
}
