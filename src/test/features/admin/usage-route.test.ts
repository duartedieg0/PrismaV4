import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminRouteAccess = vi.fn();
const threadsListResult = vi.fn();

vi.mock("@/features/admin/shared/admin-guard", () => ({
  requireAdminRouteAccess,
}));

vi.mock("@/gateways/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from(table: string) {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { full_name: "Maria Silva", email: "maria@escola.br" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "consultant_threads") {
        return {
          select: vi.fn().mockReturnValue({
            not: threadsListResult,
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: threadsListResult,
              }),
            }),
          }),
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

  it("deve retornar dados do usuário e lista de threads", async () => {
    threadsListResult.mockResolvedValue({
      data: [
        {
          id: "thread-1",
          title: "Adaptação de questões",
          total_input_tokens: 5000,
          total_output_tokens: 3200,
          total_cache_read_tokens: 20000,
          total_cache_creation_tokens: 2000,
          estimated_cost_usd: 0.063,
          updated_at: "2026-04-10T10:00:00Z",
        },
      ],
      error: null,
    });

    const { GET: GETUser } = await import("@/app/api/admin/usage/[userId]/route");
    const req = new Request("http://localhost/api/admin/usage/user-1");
    const res = await GETUser(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.user.name).toBe("Maria Silva");
    expect(body.data.threads).toHaveLength(1);
    expect(body.data.threads[0].threadId).toBe("thread-1");
    expect(body.data.threads[0].estimatedCostUSD).toBeCloseTo(0.063, 5);
  });

  it("deve retornar 401 para não-admin", async () => {
    requireAdminRouteAccess.mockResolvedValue({
      kind: "error",
      response: new Response(null, { status: 401 }),
    });

    const { GET: GETUser } = await import("@/app/api/admin/usage/[userId]/route");
    const res = await GETUser(new Request("http://localhost/api/admin/usage/user-1"));
    expect(res.status).toBe(401);
  });
});
