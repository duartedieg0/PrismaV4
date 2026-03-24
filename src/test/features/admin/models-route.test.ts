import { beforeEach, describe, expect, it, vi } from "vitest";

const selectOrder = vi.fn();
const insertSingle = vi.fn();
const updateSingle = vi.fn();
const deleteEq = vi.fn();
const supportsUpdateSelect = vi.fn();
const requireAdminRouteAccess = vi.fn();

vi.mock("@/features/admin/shared/admin-guard", () => ({
  requireAdminRouteAccess,
}));

vi.mock("@/gateways/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from(table: string) {
      if (table === "ai_models") {
        return {
          select: () => ({
            order: selectOrder,
            single: insertSingle,
          }),
          insert: () => ({
            select: () => ({
              single: insertSingle,
            }),
          }),
          update: () => ({
            neq: vi.fn(),
            eq: () => ({
              select: () => ({
                single: updateSingle,
              }),
            }),
          }),
          delete: () => ({
            eq: deleteEq,
          }),
        };
      }

      if (table === "supports") {
        return {
          update: () => ({
            eq: () => ({
              select: supportsUpdateSelect,
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  })),
}));

describe("models routes", () => {
  beforeEach(() => {
    requireAdminRouteAccess.mockResolvedValue({
      kind: "ok",
      role: "admin",
      userId: "admin-1",
    });
    selectOrder.mockReset();
    insertSingle.mockReset();
    updateSingle.mockReset();
    deleteEq.mockReset();
    supportsUpdateSelect.mockReset();
  });

  it("lists masked models", async () => {
    const { GET } = await import("@/app/api/admin/models/route");

    selectOrder.mockResolvedValue({
      data: [{
        id: "model-1",
        name: "GPT",
        provider: "openai",
        base_url: "https://example.com",
        api_key: "secret-123456",
        model_id: "gpt",
        enabled: true,
        is_default: true,
        system_role: null,
        created_at: "2026-03-21T00:00:00.000Z",
      }],
      error: null,
    });

    const response = await GET(new Request("http://localhost/api/admin/models"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([
      expect.objectContaining({
        apiKeyMasked: "sec...3456",
      }),
    ]);
  });

  it("creates a model", async () => {
    const { POST } = await import("@/app/api/admin/models/route");

    insertSingle.mockResolvedValue({
      data: {
        id: "model-1",
        name: "GPT",
        provider: "openai",
        base_url: "https://example.com",
        api_key: "secret-123456",
        model_id: "gpt",
        enabled: true,
        is_default: false,
        system_role: "evolution",
        created_at: "2026-03-21T00:00:00.000Z",
      },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "GPT",
          provider: "openai",
          baseUrl: "https://example.com",
          apiKey: "secret-123456",
          modelId: "gpt",
        }),
      }),
    );

    expect(response.status).toBe(201);
  });

  it("deletes a model and disables linked supports", async () => {
    const { DELETE } = await import("@/app/api/admin/models/[id]/route");

    supportsUpdateSelect.mockResolvedValue({
      data: [{ id: "support-1" }],
      error: null,
    });
    deleteEq.mockResolvedValue({ error: null });

    const response = await DELETE(
      new Request("http://localhost/api/admin/models/model-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "model-1" }) },
    );

    expect(response.status).toBe(200);
  });
});
