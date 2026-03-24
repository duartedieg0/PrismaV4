import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleAccessControl } from "@/features/access-control/assert-access";

describe("phase 2 proxy handoff", () => {
  it("exposes the Next.js proxy entrypoint and matcher config", async () => {
    const proxyModule = await import("@/proxy");

    expect(typeof proxyModule.proxy).toBe("function");
    expect(proxyModule).toHaveProperty("config");
    expect(proxyModule.config).toEqual({
      matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the exported proxy entrypoint to redirect anonymous requests", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const { proxy } = await import("@/proxy");
    const response = await proxy(new NextRequest("http://localhost:3000/dashboard"));

    expect(response?.headers.get("location")).toBe("http://localhost:3000/login");
    expect(response?.status).toBe(307);
  });

  it("redirects unauthenticated teacher routes to login", async () => {
    const request = new NextRequest("http://localhost:3000/dashboard");

    const response = await handleAccessControl(request, {
      resolveAuthenticatedUser: vi.fn().mockResolvedValue({
        kind: "anonymous",
      }),
      resolveProfile: vi.fn(),
    });

    expect(response?.headers.get("location")).toBe("http://localhost:3000/login");
    expect(response?.status).toBe(307);
  });

  it("does not call Supabase resolvers when there is no auth cookie", async () => {
    const request = new NextRequest("http://localhost:3000/config");
    const resolveAuthenticatedUser = vi.fn();
    const resolveProfile = vi.fn();

    const response = await handleAccessControl(request, {
      resolveAuthenticatedUser,
      resolveProfile,
    });

    expect(resolveAuthenticatedUser).not.toHaveBeenCalled();
    expect(resolveProfile).not.toHaveBeenCalled();
    expect(response?.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("redirects blocked users before honoring admin access", async () => {
    const request = new NextRequest("http://localhost:3000/config", {
      headers: {
        cookie: "sb-localhost-auth-token=token",
      },
    });

    const response = await handleAccessControl(request, {
      resolveAuthenticatedUser: vi.fn().mockResolvedValue({
        kind: "authenticated",
        user: { id: "1", email: "admin@example.com" },
      }),
      resolveProfile: vi.fn().mockResolvedValue({
        kind: "profile",
        profile: {
          id: "1",
          email: "admin@example.com",
          role: "admin",
          blocked: true,
        },
      }),
    });

    expect(response?.headers.get("location")).toBe("http://localhost:3000/blocked");
    expect(response?.status).toBe(307);
  });

  it("allows admins into /api/admin namespaces", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users", {
      headers: {
        cookie: "sb-localhost-auth-token=token",
      },
    });

    const response = await handleAccessControl(request, {
      resolveAuthenticatedUser: vi.fn().mockResolvedValue({
        kind: "authenticated",
        user: { id: "1", email: "admin@example.com" },
      }),
      resolveProfile: vi.fn().mockResolvedValue({
        kind: "profile",
        profile: {
          id: "1",
          email: "admin@example.com",
          role: "admin",
          blocked: false,
        },
      }),
    });

    expect(response).toBeNull();
  });

  it("redirects expired sessions to login with an error marker", async () => {
    const request = new NextRequest("http://localhost:3000/dashboard", {
      headers: {
        cookie: "sb-localhost-auth-token=token",
      },
    });

    const response = await handleAccessControl(request, {
      resolveAuthenticatedUser: vi.fn().mockResolvedValue({
        kind: "expired",
        reason: "Sua sessao expirou. Entre novamente.",
      }),
      resolveProfile: vi.fn(),
    });

    expect(response?.headers.get("location")).toBe(
      "http://localhost:3000/login?error=expired_session",
    );
  });

  it("allows the login route to render when the session exists but the profile is missing", async () => {
    const request = new NextRequest("http://localhost:3000/login", {
      headers: {
        cookie: "sb-localhost-auth-token=token",
      },
    });

    const response = await handleAccessControl(request, {
      resolveAuthenticatedUser: vi.fn().mockResolvedValue({
        kind: "authenticated",
        user: { id: "1", email: "teacher@example.com" },
      }),
      resolveProfile: vi.fn().mockResolvedValue({
        kind: "redirect",
        redirectTo: "/login?error=missing_profile",
        reason: "missing_profile",
        message: "Perfil de acesso nao encontrado.",
      }),
    });

    expect(response).toBeNull();
  });
});
