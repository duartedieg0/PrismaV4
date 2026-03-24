import { describe, expect, it, vi, beforeEach } from "vitest";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 200 with healthy status and timestamp", async () => {
    const { GET } = await import("@/app/api/health/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).getTime()).not.toBeNaN();
  });
});

describe("GET /api/ready", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 503 when supabase credentials are missing", async () => {
    vi.doMock("@/gateways/supabase/environment", () => ({
      hasSupabaseCredentials: () => false,
    }));

    const { GET } = await import("@/app/api/ready/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("not_ready");
    expect(body.checks.supabaseCredentials).toBe(false);
    expect(body.checks.supabaseConnection).toBe(false);
  });

  it("returns 503 when supabase connection fails", async () => {
    vi.doMock("@/gateways/supabase/environment", () => ({
      hasSupabaseCredentials: () => true,
    }));

    vi.doMock("@/gateways/supabase/server", () => ({
      createClient: async () => ({
        from: () => ({
          select: () => ({
            limit: () => ({ error: new Error("connection refused") }),
          }),
        }),
      }),
    }));

    const { GET } = await import("@/app/api/ready/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("not_ready");
    expect(body.checks.supabaseCredentials).toBe(true);
    expect(body.checks.supabaseConnection).toBe(false);
  });

  it("returns 200 when supabase is connected", async () => {
    vi.doMock("@/gateways/supabase/environment", () => ({
      hasSupabaseCredentials: () => true,
    }));

    vi.doMock("@/gateways/supabase/server", () => ({
      createClient: async () => ({
        from: () => ({
          select: () => ({
            limit: () => ({ data: [{ id: "1" }], error: null }),
          }),
        }),
      }),
    }));

    const { GET } = await import("@/app/api/ready/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ready");
    expect(body.checks.supabaseCredentials).toBe(true);
    expect(body.checks.supabaseConnection).toBe(true);
  });

  it("returns 503 when createClient throws", async () => {
    vi.doMock("@/gateways/supabase/environment", () => ({
      hasSupabaseCredentials: () => true,
    }));

    vi.doMock("@/gateways/supabase/server", () => ({
      createClient: async () => {
        throw new Error("unexpected");
      },
    }));

    const { GET } = await import("@/app/api/ready/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("not_ready");
    expect(body.checks.supabaseConnection).toBe(false);
  });
});
