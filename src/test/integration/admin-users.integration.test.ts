import { describe, expect, it } from "vitest";
import {
  buildGovernancePatch,
  determineGovernanceAction,
  toAdminUserListItem,
} from "@/features/admin/users/service";
import { toAuditEntry } from "@/features/admin/audit/service";

describe("admin users integration helpers", () => {
  it("maps profile records into admin user list items", () => {
    expect(
      toAdminUserListItem({
        id: "user-1",
        full_name: "Professor Um",
        email: "prof@example.com",
        avatar_url: null,
        role: "teacher",
        blocked: false,
        created_at: "2026-03-21T00:00:00.000Z",
      }),
    ).toEqual({
      id: "user-1",
      fullName: "Professor Um",
      email: "prof@example.com",
      avatarUrl: null,
      role: "teacher",
      blocked: false,
      createdAt: "2026-03-21T00:00:00.000Z",
    });
  });

  it("builds governance patches with only changed keys", () => {
    expect(buildGovernancePatch({ blocked: true })).toEqual({ blocked: true });
    expect(buildGovernancePatch({ role: "admin" })).toEqual({ role: "admin" });
  });

  it("maps persisted audit rows into audit entries", () => {
    expect(
      toAuditEntry({
        id: "audit-1",
        admin_user_id: "admin-1",
        target_user_id: "user-1",
        action: "user_blocked",
        previous_state: { role: "teacher", blocked: false },
        next_state: { role: "teacher", blocked: true },
        created_at: "2026-03-21T00:00:00.000Z",
      }),
    ).toEqual({
      id: "audit-1",
      adminUserId: "admin-1",
      targetUserId: "user-1",
      action: "user_blocked",
      previousState: { role: "teacher", blocked: false },
      nextState: { role: "teacher", blocked: true },
      createdAt: "2026-03-21T00:00:00.000Z",
    });
  });

  it("detects role changes separately from block state", () => {
    expect(
      determineGovernanceAction({
        current: { role: "teacher", blocked: false },
        next: { role: "admin", blocked: false },
      }),
    ).toEqual({
      type: "user_role_changed",
      role: "admin",
    });
  });
});
