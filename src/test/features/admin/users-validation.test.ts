import { describe, expect, it } from "vitest";
import { updateAdminUserSchema } from "@/features/admin/users/validation";
import {
  assertGovernanceAllowed,
  determineGovernanceAction,
} from "@/features/admin/users/service";

describe("admin users validation", () => {
  it("requires at least one governance change", () => {
    const parsed = updateAdminUserSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });

  it("accepts role and blocked updates", () => {
    const parsed = updateAdminUserSchema.safeParse({
      blocked: true,
      role: "admin",
    });

    expect(parsed.success).toBe(true);
  });

  it("detects block actions", () => {
    expect(
      determineGovernanceAction({
        current: { role: "teacher", blocked: false },
        next: { role: "teacher", blocked: true },
      }),
    ).toEqual({
      type: "user_blocked",
      blocked: true,
    });
  });

  it("rejects self-blocking", () => {
    expect(() =>
      assertGovernanceAllowed({
        actorUserId: "user-1",
        targetUserId: "user-1",
        currentTarget: { role: "teacher", blocked: false },
        nextTarget: { role: "teacher", blocked: true },
        adminCount: 1,
      }),
    ).toThrow("Você não pode bloquear sua própria conta.");
  });

  it("rejects removing the last admin", () => {
    expect(() =>
      assertGovernanceAllowed({
        actorUserId: "admin-2",
        targetUserId: "admin-1",
        currentTarget: { role: "admin", blocked: false },
        nextTarget: { role: "teacher", blocked: false },
        adminCount: 1,
      }),
    ).toThrow("O sistema precisa manter ao menos um administrador ativo.");
  });
});
