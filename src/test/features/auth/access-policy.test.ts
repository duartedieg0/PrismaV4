import { describe, expect, it } from "vitest";
import { resolveAccessDecision } from "@/features/access-control/access-policy";

describe("phase 2 access policy", () => {
  it("redirects unauthenticated users away from teacher routes", () => {
    expect(
      resolveAccessDecision({
        route: "/dashboard",
        sessionUser: null,
        profile: null,
      }),
    ).toEqual({
      level: "teacher",
      allow: false,
      redirectTo: "/login",
      reason: "missing_session",
      message: "Voce precisa entrar para continuar.",
    });
  });

  it("redirects blocked users before any other access rule", () => {
    expect(
      resolveAccessDecision({
        route: "/config",
        sessionUser: { id: "1", email: "admin@example.com" },
        profile: {
          id: "1",
          email: "admin@example.com",
          role: "admin",
          blocked: true,
        },
      }),
    ).toEqual({
      level: "blocked",
      allow: false,
      redirectTo: "/blocked",
      reason: "blocked_user",
      message: "Seu acesso esta bloqueado.",
    });
  });

  it("redirects teachers away from admin routes", () => {
    expect(
      resolveAccessDecision({
        route: "/config",
        sessionUser: { id: "1", email: "teacher@example.com" },
        profile: {
          id: "1",
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

  it("redirects authenticated users away from login", () => {
    expect(
      resolveAccessDecision({
        route: "/login",
        sessionUser: { id: "1", email: "teacher@example.com" },
        profile: {
          id: "1",
          email: "teacher@example.com",
          role: "teacher",
          blocked: false,
        },
      }),
    ).toEqual({
      level: "public",
      allow: false,
      redirectTo: "/dashboard",
      reason: "authenticated_redirect",
      message: "Voce ja esta autenticado.",
    });
  });

  it("redirects authenticated users away from the public landing", () => {
    expect(
      resolveAccessDecision({
        route: "/",
        sessionUser: { id: "1", email: "teacher@example.com" },
        profile: {
          id: "1",
          email: "teacher@example.com",
          role: "teacher",
          blocked: false,
        },
      }),
    ).toEqual({
      level: "public",
      allow: false,
      redirectTo: "/dashboard",
      reason: "authenticated_redirect",
      message: "Voce ja esta autenticado.",
    });
  });

  it("allows the login page when the session exists but the profile is missing", () => {
    expect(
      resolveAccessDecision({
        route: "/login",
        sessionUser: { id: "1", email: "teacher@example.com" },
        profile: null,
      }),
    ).toEqual({
      level: "public",
      allow: true,
    });
  });

  it("allows admins into admin routes", () => {
    expect(
      resolveAccessDecision({
        route: "/config",
        sessionUser: { id: "1", email: "admin@example.com" },
        profile: {
          id: "1",
          email: "admin@example.com",
          role: "admin",
          blocked: false,
        },
      }),
    ).toEqual({
      level: "admin",
      allow: true,
    });
  });
});
