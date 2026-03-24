import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { toAdminUserListItem } from "@/features/admin/users/service";
import { createClient } from "@/gateways/supabase/server";

export async function GET() {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role, blocked, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map(toAdminUserListItem));
}
