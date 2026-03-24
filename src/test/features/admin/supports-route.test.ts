import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminRouteAccess = vi.fn();
const supportsOrder = vi.fn();
const agentsSingle = vi.fn();
const modelsSingle = vi.fn();
const supportsInsertSingle = vi.fn();

vi.mock("@/features/admin/shared/admin-guard", () => ({
  requireAdminRouteAccess,
}));

vi.mock("@/gateways/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from(table: string) {
      if (table === "supports") {
        return {
          select: () => ({
            order: supportsOrder,
            single: supportsInsertSingle,
          }),
          insert: () => ({
            select: () => ({
              single: supportsInsertSingle,
            }),
          }),
        };
      }

      if (table === "agents") {
        return {
          select: () => ({
            eq: () => ({
              single: agentsSingle,
            }),
          }),
        };
      }

      if (table === "ai_models") {
        return {
          select: () => ({
            eq: () => ({
              single: modelsSingle,
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  })),
}));

describe("supports route", () => {
  beforeEach(() => {
    requireAdminRouteAccess.mockResolvedValue({
      kind: "ok",
      role: "admin",
      userId: "admin-1",
    });
    supportsOrder.mockReset();
    agentsSingle.mockReset();
    modelsSingle.mockReset();
    supportsInsertSingle.mockReset();
  });

  it("lists supports with joined agent and model names", async () => {
    const { GET } = await import("@/app/api/admin/supports/route");

    supportsOrder.mockResolvedValue({
      data: [{
        id: "support-1",
        name: "Leitura guiada",
        agent_id: "agent-1",
        model_id: "model-1",
        enabled: true,
        created_at: "2026-03-21T00:00:00.000Z",
        agents: { name: "BNCC" },
        ai_models: { name: "GPT", model_id: "gpt-5.4" },
      }],
      error: null,
    });

    const response = await GET(new Request("http://localhost/api/admin/supports"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([
      expect.objectContaining({
        agentName: "BNCC",
        modelIdentifier: "gpt-5.4",
      }),
    ]);
  });

  it("rejects supports linked to disabled agents", async () => {
    const { POST } = await import("@/app/api/admin/supports/route");

    agentsSingle.mockResolvedValue({
      data: { id: "agent-1", enabled: false },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/admin/supports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Leitura guiada",
          agentId: "550e8400-e29b-41d4-a716-446655440000",
          modelId: null,
        }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
