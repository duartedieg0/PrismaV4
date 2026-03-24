import { describe, expect, it } from "vitest";
import { resolveAccessDecision } from "@/features/access-control/access-policy";

describe("phase 2 auth/access integration", () => {
  it("routes missing profiles to login with deterministic reason", () => {
    expect(
      resolveAccessDecision({
        route: "/dashboard",
        sessionUser: { id: "user-1", email: "teacher@example.com" },
        profile: null,
      }),
    ).toEqual({
      level: "teacher",
      allow: false,
      redirectTo: "/login?error=missing_profile",
      reason: "missing_profile",
      message: "Perfil de acesso nao encontrado.",
    });
  });

  it("treats admin api routes as admin-only", () => {
    expect(
      resolveAccessDecision({
        route: "/api/admin/users",
        sessionUser: { id: "user-1", email: "teacher@example.com" },
        profile: {
          id: "user-1",
          email: "teacher@example.com",
          role: "teacher",
          blocked: false,
        },
      }),
    ).toEqual({
      level: "admin",
      allow: false,
      redirectTo: "/dashboard",
      reason: "role_mismatch",
      message: "Voce nao tem permissao para acessar esta area.",
    });
  });
});
