import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { toAdminSupportView } from "@/features/admin/supports/service";
import { createSupportSchema } from "@/features/admin/supports/validation";
import { createClient } from "@/gateways/supabase/server";

export async function GET() {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supports")
    .select("id, name, agent_id, model_id, enabled, created_at, agents(name), ai_models(name, model_id)")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map((item) => toAdminSupportView(item as never)));
}

export async function POST(request: Request) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const parsed = createSupportSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = await createClient();

  const [{ data: agent }, { data: model }] = await Promise.all([
    supabase.from("agents").select("id, enabled").eq("id", parsed.data.agentId).single(),
    parsed.data.modelId
      ? supabase.from("ai_models").select("id, enabled").eq("id", parsed.data.modelId).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!agent?.id || !agent.enabled) {
    return NextResponse.json({ error: "Selecione um agente habilitado." }, { status: 400 });
  }

  if (parsed.data.modelId && (!model?.id || !model.enabled)) {
    return NextResponse.json({ error: "Selecione um modelo habilitado." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("supports")
    .insert({
      name: parsed.data.name,
      agent_id: parsed.data.agentId,
      model_id: parsed.data.modelId,
      enabled: parsed.data.enabled ?? true,
    })
    .select("id, name, agent_id, model_id, enabled, created_at, agents(name), ai_models(name, model_id)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toAdminSupportView(data as never), { status: 201 });
}
