import type { AuditEntry } from "@/features/admin/audit/contracts";

export function toAuditEntry(input: {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  action: "user_blocked" | "user_unblocked" | "user_role_changed";
  previous_state: {
    role: "teacher" | "admin";
    blocked: boolean;
  };
  next_state: {
    role: "teacher" | "admin";
    blocked: boolean;
  };
  created_at: string;
}): AuditEntry {
  return {
    id: input.id,
    adminUserId: input.admin_user_id,
    targetUserId: input.target_user_id,
    action: input.action,
    previousState: input.previous_state,
    nextState: input.next_state,
    createdAt: input.created_at,
  };
}
