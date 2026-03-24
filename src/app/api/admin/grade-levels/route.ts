import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { toEnabledNameEntity } from "@/features/admin/curriculum/service";
import { createEnabledNameEntitySchema } from "@/features/admin/curriculum/validation";
import { createClient } from "@/gateways/supabase/server";

export async function GET() {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grade_levels")
    .select("id, name, enabled")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map(toEnabledNameEntity));
}

export async function POST(request: Request) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const parsed = createEnabledNameEntitySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grade_levels")
    .insert({ name: parsed.data.name })
    .select("id, name, enabled")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toEnabledNameEntity(data), { status: 201 });
}
