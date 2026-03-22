export type AuditEntry = {
  id: string;
  adminUserId: string;
  targetUserId: string;
  action: "user_blocked" | "user_unblocked" | "user_role_changed";
  previousState: {
    role: "teacher" | "admin";
    blocked: boolean;
  };
  nextState: {
    role: "teacher" | "admin";
    blocked: boolean;
  };
  createdAt: string;
};
