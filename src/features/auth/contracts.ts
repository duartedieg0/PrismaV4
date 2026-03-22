import type { UserRole } from "@/domains";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  role: UserRole;
  blocked: boolean;
};

export function createAuthenticatedUser(
  user: AuthenticatedUser,
): AuthenticatedUser {
  return user;
}

export function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    (typeof candidate.email === "string" || candidate.email === null) &&
    (candidate.role === "teacher" || candidate.role === "admin") &&
    typeof candidate.blocked === "boolean"
  );
}
