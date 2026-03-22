export const USER_ROLES = ["teacher", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_USER_ROLE: UserRole = USER_ROLES[0];

export function getDefaultUserRole(): UserRole {
  return DEFAULT_USER_ROLE;
}

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  blocked: boolean;
  created_at: string;
}
