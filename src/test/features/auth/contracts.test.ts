import { describe, expect, it } from "vitest";
import {
  ACCESS_LEVELS,
  createAccessDecision,
  isAccessLevel,
} from "@/features/access-control/contracts";
import {
  createAuthenticatedUser,
  isAuthenticatedUser,
} from "@/features/auth/contracts";
import { createBlockedUserState } from "@/features/user-lifecycle/contracts";

describe("phase 2 auth contracts", () => {
  it("formalizes authenticated user payloads", () => {
    const user = createAuthenticatedUser({
      id: "user-1",
      email: "teacher@example.com",
      role: "teacher",
      blocked: false,
    });

    expect(user).toEqual({
      id: "user-1",
      email: "teacher@example.com",
      role: "teacher",
      blocked: false,
    });
    expect(isAuthenticatedUser(user)).toBe(true);
  });

  it("formalizes access levels and decisions", () => {
    expect(ACCESS_LEVELS).toEqual(["public", "teacher", "admin", "blocked"]);
    expect(isAccessLevel("admin")).toBe(true);
    expect(isAccessLevel("owner")).toBe(false);

    expect(
      createAccessDecision({
        level: "admin",
        allow: false,
        redirectTo: "/dashboard",
        reason: "role_mismatch",
      }),
    ).toEqual({
      level: "admin",
      allow: false,
      redirectTo: "/dashboard",
      reason: "role_mismatch",
    });
  });

  it("formalizes blocked user state", () => {
    expect(
      createBlockedUserState({
        isBlocked: true,
        redirectTo: "/blocked",
        message: "Seu acesso foi bloqueado.",
      }),
    ).toEqual({
      isBlocked: true,
      redirectTo: "/blocked",
      message: "Seu acesso foi bloqueado.",
    });
  });
});
