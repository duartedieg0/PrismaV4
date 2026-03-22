import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { toAuditEntry } from "@/features/admin/audit/service";
import {
  assertGovernanceAllowed,
  buildGovernancePatch,
  determineGovernanceAction,
  toAdminUserListItem,
} from "@/features/admin/users/service";
import { updateAdminUserSchema } from "@/features/admin/users/validation";
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
  const parsed = updateAdminUserSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: targetUser, error: targetError } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role, blocked, created_at")
    .eq("id", id)
    .single();

  if (targetError || !targetUser) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const nextTarget = {
    role: parsed.data.role ?? targetUser.role,
    blocked: parsed.data.blocked ?? targetUser.blocked,
  } as const;

  const { count: adminCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  try {
    assertGovernanceAllowed({
      actorUserId: access.userId,
      targetUserId: targetUser.id,
      currentTarget: {
        role: targetUser.role,
        blocked: targetUser.blocked,
      },
      nextTarget,
      adminCount: adminCount ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ação não permitida." },
      { status: 403 },
    );
  }

  const action = determineGovernanceAction({
    current: {
      role: targetUser.role,
      blocked: targetUser.blocked,
    },
    next: nextTarget,
  });

  if (!action) {
    return NextResponse.json(toAdminUserListItem(targetUser));
  }

  const { data: updatedUser, error: updateError } = await supabase
    .from("profiles")
    .update(buildGovernancePatch(parsed.data))
    .eq("id", id)
    .select("id, full_name, email, avatar_url, role, blocked, created_at")
    .single();

  if (updateError || !updatedUser) {
    return NextResponse.json({ error: updateError?.message ?? "Erro ao atualizar usuário." }, { status: 500 });
  }

  const { data: auditRow, error: auditError } = await supabase
    .from("admin_audit_logs")
    .insert({
      admin_user_id: access.userId,
      target_user_id: targetUser.id,
      action: action.type,
      previous_state: {
        role: targetUser.role,
        blocked: targetUser.blocked,
      },
      next_state: {
        role: updatedUser.role,
        blocked: updatedUser.blocked,
      },
    })
    .select("id, admin_user_id, target_user_id, action, previous_state, next_state, created_at")
    .single();

  if (auditError || !auditRow) {
    return NextResponse.json({ error: auditError?.message ?? "Erro ao registrar auditoria." }, { status: 500 });
  }

  toAuditEntry(auditRow);

  return NextResponse.json(toAdminUserListItem(updatedUser));
}
