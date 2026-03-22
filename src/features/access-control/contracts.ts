export const ACCESS_LEVELS = ["public", "teacher", "admin", "blocked"] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export type AccessDecision = {
  level: AccessLevel;
  allow: boolean;
  redirectTo?: string;
  message?: string;
  reason?:
    | "authenticated_redirect"
    | "missing_session"
    | "missing_profile"
    | "blocked_user"
    | "role_mismatch"
    | "expired_token";
};

export function createAccessDecision(
  decision: AccessDecision,
): AccessDecision {
  return decision;
}

export function isAccessLevel(value: string): value is AccessLevel {
  return (ACCESS_LEVELS as readonly string[]).includes(value);
}
