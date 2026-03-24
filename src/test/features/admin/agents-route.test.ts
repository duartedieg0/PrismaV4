import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminRouteAccess = vi.fn();
const agentsSelectOrder = vi.fn();
const agentsInsertSingle = vi.fn();
const agentsSelectSingle = vi.fn();
const agentsUpdateSingle = vi.fn();
const supportsHeadEq = vi.fn();
const agentsDeleteEq = vi.fn();

vi.mock("@/features/admin/shared/admin-guard", () => ({
  requireAdminRouteAccess,
}));

vi.mock("@/gateways/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from(table: string) {
      if (table === "agents") {
        return {
          select: () => ({
            order: agentsSelectOrder,
            eq: () => ({
              single: agentsSelectSingle,
            }),
          }),
          insert: () => ({
            select: () => ({
              single: agentsInsertSingle,
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: agentsUpdateSingle,
              }),
            }),
          }),
          delete: () => ({
            eq: agentsDeleteEq,
          }),
        };
      }

      if (table === "supports") {
        return {
          select: () => ({
            eq: supportsHeadEq,
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  })),
}));

describe("agents routes", () => {
  beforeEach(() => {
    requireAdminRouteAccess.mockResolvedValue({
      kind: "ok",
      role: "admin",
      userId: "admin-1",
    });
    agentsSelectOrder.mockReset();
    agentsInsertSingle.mockReset();
    agentsSelectSingle.mockReset();
    agentsUpdateSingle.mockReset();
    supportsHeadEq.mockReset();
    agentsDeleteEq.mockReset();
  });

  it("lists agents", async () => {
    const { GET } = await import("@/app/api/admin/agents/route");

    agentsSelectOrder.mockResolvedValue({
      data: [{
        id: "agent-1",
        name: "BNCC",
        objective: null,
        prompt: "Prompt",
        version: 1,
        enabled: true,
        created_at: "2026-03-21T00:00:00.000Z",
        updated_at: "2026-03-21T00:00:00.000Z",
      }],
      error: null,
    });

    const response = await GET(new Request("http://localhost/api/admin/agents"));
    expect(response.status).toBe(200);
  });

  it("creates agents", async () => {
    const { POST } = await import("@/app/api/admin/agents/route");

    agentsInsertSingle.mockResolvedValue({
      data: {
        id: "agent-1",
        name: "BNCC",
        objective: "Analisar BNCC",
        prompt: "Prompt",
        version: 1,
        enabled: true,
        created_at: "2026-03-21T00:00:00.000Z",
        updated_at: "2026-03-21T00:00:00.000Z",
      },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "BNCC",
          objective: "Analisar BNCC",
          prompt: "Prompt",
        }),
      }),
    );

    expect(response.status).toBe(201);
  });

  it("blocks deletion when supports still reference the agent", async () => {
    const { DELETE } = await import("@/app/api/admin/agents/[id]/route");

    supportsHeadEq.mockResolvedValue({
      count: 1,
    });

    const response = await DELETE(
      new Request("http://localhost/api/admin/agents/agent-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "agent-1" }) },
    );

    expect(response.status).toBe(409);
  });
});
