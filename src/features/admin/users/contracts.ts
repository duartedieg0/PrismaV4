export type AdminUserRole = "teacher" | "admin";

export type AdminUserListItem = {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: AdminUserRole;
  blocked: boolean;
  createdAt: string;
};

export type UserGovernanceAction =
  | {
      type: "user_blocked" | "user_unblocked";
      blocked: boolean;
    }
  | {
      type: "user_role_changed";
      role: AdminUserRole;
    };
