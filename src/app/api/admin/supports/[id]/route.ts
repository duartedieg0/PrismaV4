import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { toAdminSupportView } from "@/features/admin/supports/service";
import { updateSupportSchema } from "@/features/admin/supports/validation";
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
  const parsed = updateSupportSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = await createClient();
  const patch: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.agentId !== undefined) patch.agent_id = parsed.data.agentId;
  if (parsed.data.modelId !== undefined) patch.model_id = parsed.data.modelId;
  if (parsed.data.enabled !== undefined) patch.enabled = parsed.data.enabled;

  if (parsed.data.agentId) {
    const { data: agent } = await supabase.from("agents").select("id, enabled").eq("id", parsed.data.agentId).single();

    if (!agent?.id || !agent.enabled) {
      return NextResponse.json({ error: "Selecione um agente habilitado." }, { status: 400 });
    }
  }

  if (parsed.data.modelId) {
    const { data: model } = await supabase.from("ai_models").select("id, enabled").eq("id", parsed.data.modelId).single();

    if (!model?.id || !model.enabled) {
      return NextResponse.json({ error: "Selecione um modelo habilitado." }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("supports")
    .update(patch)
    .eq("id", id)
    .select("id, name, agent_id, model_id, enabled, created_at, agents(name), ai_models(name, model_id)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toAdminSupportView(data as never));
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const { id } = await params;
  const supabase = await createClient();
  const { count } = await supabase
    .from("exam_supports")
    .select("exam_id", { count: "exact", head: true })
    .eq("support_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Apoios usados em provas devem ser desabilitados, não excluídos." },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("supports").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
