import type { AdminUserListItem, UserGovernanceAction } from "@/features/admin/users/contracts";
import type { UpdateAdminUserInput } from "@/features/admin/users/validation";

type UserSnapshot = {
  role: "teacher" | "admin";
  blocked: boolean;
};

export function toAdminUserListItem(input: {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: "teacher" | "admin";
  blocked: boolean;
  created_at: string;
}): AdminUserListItem {
  return {
    id: input.id,
    fullName: input.full_name,
    email: input.email,
    avatarUrl: input.avatar_url,
    role: input.role,
    blocked: input.blocked,
    createdAt: input.created_at,
  };
}

export function buildGovernancePatch(input: UpdateAdminUserInput) {
  const patch: Record<string, unknown> = {};

  if (input.blocked !== undefined) {
    patch.blocked = input.blocked;
  }

  if (input.role !== undefined) {
    patch.role = input.role;
  }

  return patch;
}

export function determineGovernanceAction(input: {
  current: UserSnapshot;
  next: UserSnapshot;
}): UserGovernanceAction | null {
  if (input.current.blocked !== input.next.blocked) {
    return {
      type: input.next.blocked ? "user_blocked" : "user_unblocked",
      blocked: input.next.blocked,
    };
  }

  if (input.current.role !== input.next.role) {
    return {
      type: "user_role_changed",
      role: input.next.role,
    };
  }

  return null;
}

export function assertGovernanceAllowed(input: {
  actorUserId: string;
  targetUserId: string;
  currentTarget: UserSnapshot;
  nextTarget: UserSnapshot;
  adminCount: number;
}) {
  if (input.actorUserId === input.targetUserId && input.currentTarget.blocked !== input.nextTarget.blocked) {
    throw new Error("Você não pode bloquear sua própria conta.");
  }

  if (
    input.actorUserId === input.targetUserId &&
    input.currentTarget.role === "admin" &&
    input.nextTarget.role === "teacher"
  ) {
    throw new Error("Você não pode rebaixar sua própria conta administrativa.");
  }

  if (
    input.currentTarget.role === "admin" &&
    input.nextTarget.role === "teacher" &&
    input.adminCount <= 1
  ) {
    throw new Error("O sistema precisa manter ao menos um administrador ativo.");
  }
}
