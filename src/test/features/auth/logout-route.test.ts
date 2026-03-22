import { afterEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn();
const deleteCookie = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [
      { name: "sb-localhost-auth-token" },
      { name: "sb-localhost-auth-token-code-verifier" },
      { name: "theme" },
    ],
    delete: deleteCookie,
  })),
}));

vi.mock("@/gateways/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signOut,
    },
  })),
}));

describe("logout route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("signs out, removes auth cookies and redirects home", async () => {
    const { POST } = await import("@/app/(public)/logout/route");

    signOut.mockResolvedValue(undefined);
    deleteCookie.mockReset();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    const response = await POST(new Request("http://localhost:3000/logout", { method: "POST" }));

    expect(signOut).toHaveBeenCalledOnce();
    expect(deleteCookie).toHaveBeenCalledTimes(2);
    expect(deleteCookie).toHaveBeenCalledWith("sb-localhost-auth-token");
    expect(deleteCookie).toHaveBeenCalledWith("sb-localhost-auth-token-code-verifier");
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("still clears cookies and redirects home when Supabase credentials are absent", async () => {
    const { POST } = await import("@/app/(public)/logout/route");

    signOut.mockReset();
    deleteCookie.mockReset();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const response = await POST(new Request("http://localhost:3000/logout", { method: "POST" }));

    expect(signOut).not.toHaveBeenCalled();
    expect(deleteCookie).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });
});
