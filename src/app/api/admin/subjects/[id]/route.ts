import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { toEnabledNameEntity } from "@/features/admin/curriculum/service";
import { updateEnabledEntitySchema } from "@/features/admin/curriculum/validation";
import { createClient } from "@/gateways/supabase/server";

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
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .update({ enabled: parsed.data.enabled })
    .eq("id", id)
    .select("id, name, enabled")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toEnabledNameEntity(data));
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
    .eq("subject_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Disciplinas já usadas em provas devem ser desabilitadas, não excluídas." },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("subjects").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
