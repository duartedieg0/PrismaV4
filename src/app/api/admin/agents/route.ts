import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { toAdminAgentView } from "@/features/admin/agents/service";
import { createAgentSchema } from "@/features/admin/agents/validation";
import { createClient } from "@/gateways/supabase/server";

export async function GET() {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id, name, objective, prompt, version, enabled, created_at, updated_at")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map(toAdminAgentView));
}

export async function POST(request: Request) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const parsed = createAgentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .insert({
      name: parsed.data.name,
      objective: parsed.data.objective ?? null,
      prompt: parsed.data.prompt,
      enabled: parsed.data.enabled ?? true,
    })
    .select("id, name, objective, prompt, version, enabled, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toAdminAgentView(data), { status: 201 });
}
