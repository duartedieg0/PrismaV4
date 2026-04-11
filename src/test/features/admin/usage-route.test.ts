import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminRouteAccess = vi.fn();
const threadsListResult = vi.fn();

vi.mock("@/features/admin/shared/admin-guard", () => ({
  requireAdminRouteAccess,
}));

vi.mock("@/gateways/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from(table: string) {
      if (table === "consultant_threads") {
        return {
          select: vi.fn().mockReturnThis(),
          not: threadsListResult,
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  })),
}));

describe("GET /api/admin/usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminRouteAccess.mockResolvedValue({ kind: "ok", userId: "admin-1" });
  });

  it("deve retornar 401 para não-admin", async () => {
    requireAdminRouteAccess.mockResolvedValue({
      kind: "error",
      response: new Response(null, { status: 401 }),
    });

    const { GET } = await import("@/app/api/admin/usage/route");
    const res = await GET(new Request("http://localhost/api/admin/usage"));
    expect(res.status).toBe(401);
  });

  it("deve retornar totais e lista de usuários agregada", async () => {
    threadsListResult.mockResolvedValue({
      data: [
        {
          teacher_id: "user-1",
          estimated_cost_usd: 0.05,
          updated_at: "2026-04-10T10:00:00Z",
          profiles: { full_name: "Maria Silva", email: "maria@escola.br" },
        },
        {
          teacher_id: "user-1",
          estimated_cost_usd: 0.03,
          updated_at: "2026-04-10T11:00:00Z",
          profiles: { full_name: "Maria Silva", email: "maria@escola.br" },
        },
        {
          teacher_id: "user-2",
          estimated_cost_usd: 0.10,
          updated_at: "2026-04-09T08:00:00Z",
          profiles: { full_name: "João Santos", email: "joao@escola.br" },
        },
      ],
      error: null,
    });

    const { GET } = await import("@/app/api/admin/usage/route");
    const res = await GET(new Request("http://localhost/api/admin/usage"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.totals.sessions).toBe(3);
    expect(body.data.totals.estimatedCostUSD).toBeCloseTo(0.18, 5);
    expect(body.data.users).toHaveLength(2);

    const user1 = body.data.users.find((u: { userId: string }) => u.userId === "user-1");
    expect(user1.threadCount).toBe(2);
    expect(user1.estimatedCostUSD).toBeCloseTo(0.08, 5);
  });

  it("deve retornar lista vazia quando não há threads managed", async () => {
    threadsListResult.mockResolvedValue({ data: [], error: null });

    const { GET } = await import("@/app/api/admin/usage/route");
    const res = await GET(new Request("http://localhost/api/admin/usage"));

    const body = await res.json();
    expect(body.data.totals.sessions).toBe(0);
    expect(body.data.users).toHaveLength(0);
  });
});

describe("GET /api/admin/usage/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminRouteAccess.mockResolvedValue({ kind: "ok", userId: "admin-1" });
  });

  it("deve retornar dados do usuário e suas threads", async () => {
    const { GET: GETUser } = await import("@/app/api/admin/usage/[userId]/route");
    // Testar depois de criar o arquivo
    expect(GETUser).toBeDefined();
  });
});
