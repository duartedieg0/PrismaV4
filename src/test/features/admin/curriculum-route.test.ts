import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminRouteAccess = vi.fn();
const subjectsOrder = vi.fn();
const subjectsInsertSingle = vi.fn();
const subjectsUpdateSingle = vi.fn();

vi.mock("@/features/admin/shared/admin-guard", () => ({
  requireAdminRouteAccess,
}));

vi.mock("@/gateways/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from(table: string) {
      if (table === "subjects") {
        return {
          select: () => ({
            order: subjectsOrder,
            single: subjectsInsertSingle,
          }),
          insert: () => ({
            select: () => ({
              single: subjectsInsertSingle,
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: subjectsUpdateSingle,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  })),
}));

describe("subjects routes", () => {
  beforeEach(() => {
    requireAdminRouteAccess.mockResolvedValue({
      kind: "ok",
      role: "admin",
      userId: "admin-1",
    });
    subjectsOrder.mockReset();
    subjectsInsertSingle.mockReset();
    subjectsUpdateSingle.mockReset();
  });

  it("lists subjects", async () => {
    const { GET } = await import("@/app/api/admin/subjects/route");

    subjectsOrder.mockResolvedValue({
      data: [{ id: "subject-1", name: "Matemática", enabled: true }],
      error: null,
    });

    const response = await GET(new Request("http://localhost/api/admin/curriculum"));
    expect(response.status).toBe(200);
  });

  it("creates subjects", async () => {
    const { POST } = await import("@/app/api/admin/subjects/route");

    subjectsInsertSingle.mockResolvedValue({
      data: { id: "subject-1", name: "Matemática", enabled: true },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Matemática" }),
      }),
    );

    expect(response.status).toBe(201);
  });
});
