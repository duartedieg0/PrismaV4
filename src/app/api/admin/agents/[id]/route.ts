import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { buildAgentPatch, toAdminAgentView } from "@/features/admin/agents/service";
import { updateAgentSchema } from "@/features/admin/agents/validation";
import { createClient } from "@/gateways/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id, name, objective, prompt, version, enabled, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Agente não encontrado." }, { status: 404 });
  }

  return NextResponse.json(toAdminAgentView(data));
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const { id } = await params;
  const parsed = updateAgentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .update(buildAgentPatch(parsed.data))
    .eq("id", id)
    .select("id, name, objective, prompt, version, enabled, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toAdminAgentView(data));
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const { id } = await params;
  const supabase = await createClient();
  const { count } = await supabase
    .from("supports")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Remova ou reconfigure os apoios vinculados antes de excluir o agente." },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("agents").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
