import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminRouteAccess = vi.fn();
const profilesOrder = vi.fn();
const profilesSingle = vi.fn();
const profilesHeadEq = vi.fn();
const profilesUpdateSingle = vi.fn();
const auditInsertSingle = vi.fn();

vi.mock("@/features/admin/shared/admin-guard", () => ({
  requireAdminRouteAccess,
}));

vi.mock("@/gateways/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from(table: string) {
      if (table === "profiles") {
        return {
          select: (...args: unknown[]) => {
            const options = args[1] as { head?: boolean } | undefined;

            if (options?.head) {
              return {
                eq: profilesHeadEq,
              };
            }

            return {
              order: profilesOrder,
              eq: () => ({
                single: profilesSingle,
              }),
            };
          },
          update: () => ({
            eq: () => ({
              select: () => ({
                single: profilesUpdateSingle,
              }),
            }),
          }),
        };
      }

      if (table === "admin_audit_logs") {
        return {
          insert: () => ({
            select: () => ({
              single: auditInsertSingle,
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  })),
}));

describe("admin users routes", () => {
  beforeEach(() => {
    requireAdminRouteAccess.mockResolvedValue({
      kind: "ok",
      role: "admin",
      userId: "admin-2",
    });
    profilesOrder.mockReset();
    profilesSingle.mockReset();
    profilesHeadEq.mockReset();
    profilesUpdateSingle.mockReset();
    auditInsertSingle.mockReset();
  });

  it("lists administrative users", async () => {
    const { GET } = await import("@/app/api/admin/users/route");

    profilesOrder.mockResolvedValue({
      data: [{
        id: "user-1",
        full_name: "Professor Um",
        email: "prof@example.com",
        avatar_url: null,
        role: "teacher",
        blocked: false,
        created_at: "2026-03-21T00:00:00.000Z",
      }],
      error: null,
    });

    const response = await GET(new Request("http://localhost/api/admin/users"));
    expect(response.status).toBe(200);
  });

  it("rejects self-blocking", async () => {
    const { PATCH } = await import("@/app/api/admin/users/[id]/route");

    requireAdminRouteAccess.mockResolvedValue({
      kind: "ok",
      role: "admin",
      userId: "user-1",
    });
    profilesSingle.mockResolvedValue({
      data: {
        id: "user-1",
        full_name: "Admin Um",
        email: "admin@example.com",
        avatar_url: null,
        role: "admin",
        blocked: false,
        created_at: "2026-03-21T00:00:00.000Z",
      },
      error: null,
    });
    profilesHeadEq.mockResolvedValue({ count: 1 });

    const response = await PATCH(
      new Request("http://localhost/api/admin/users/user-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: true }),
      }),
      { params: Promise.resolve({ id: "user-1" }) },
    );

    expect(response.status).toBe(403);
  });

  it("updates a user and writes an audit entry", async () => {
    const { PATCH } = await import("@/app/api/admin/users/[id]/route");

    profilesSingle.mockResolvedValue({
      data: {
        id: "user-1",
        full_name: "Professor Um",
        email: "prof@example.com",
        avatar_url: null,
        role: "teacher",
        blocked: false,
        created_at: "2026-03-21T00:00:00.000Z",
      },
      error: null,
    });
    profilesHeadEq.mockResolvedValue({ count: 2 });
    profilesUpdateSingle.mockResolvedValue({
      data: {
        id: "user-1",
        full_name: "Professor Um",
        email: "prof@example.com",
        avatar_url: null,
        role: "admin",
        blocked: false,
        created_at: "2026-03-21T00:00:00.000Z",
      },
      error: null,
    });
    auditInsertSingle.mockResolvedValue({
      data: {
        id: "audit-1",
        admin_user_id: "admin-2",
        target_user_id: "user-1",
        action: "user_role_changed",
        previous_state: { role: "teacher", blocked: false },
        next_state: { role: "admin", blocked: false },
        created_at: "2026-03-21T00:00:00.000Z",
      },
      error: null,
    });

    const response = await PATCH(
      new Request("http://localhost/api/admin/users/user-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin" }),
      }),
      { params: Promise.resolve({ id: "user-1" }) },
    );

    expect(response.status).toBe(200);
  });
});
