import { describe, expect, it, vi } from "vitest";
import { getAuthenticatedUser } from "@/features/auth/get-authenticated-user";
import { getProfileOrRedirect } from "@/features/auth/get-profile";

function createSupabaseStub(options: {
  user?: { id: string; email: string | null } | null;
  authError?: { message: string } | null;
  profile?:
    | {
        id: string;
        email: string | null;
        role: "teacher" | "admin";
        blocked: boolean;
      }
    | null;
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.user ?? null },
        error: options.authError ?? null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: options.profile ?? null,
            error: null,
          }),
        }),
      }),
    }),
  };
}

describe("phase 2 auth services", () => {
  it("resolves an authenticated user from the session", async () => {
    const supabase = createSupabaseStub({
      user: { id: "user-1", email: "teacher@example.com" },
    });

    await expect(
      getAuthenticatedUser({
        createClient: async () => supabase,
      }),
    ).resolves.toEqual({
      kind: "authenticated",
      user: {
        id: "user-1",
        email: "teacher@example.com",
      },
    });
  });

  it("treats auth exchange/session failures as expired tokens", async () => {
    const supabase = createSupabaseStub({
      authError: { message: "refresh_token_not_found" },
    });

    await expect(
      getAuthenticatedUser({
        createClient: async () => supabase,
      }),
    ).resolves.toEqual({
      kind: "expired",
      reason: "Sua sessao expirou. Entre novamente.",
    });
  });

  it("redirects when the profile is missing", async () => {
    const supabase = createSupabaseStub({
      user: { id: "user-1", email: "teacher@example.com" },
      profile: null,
    });

    await expect(
      getProfileOrRedirect({
        createClient: async () => supabase,
      }),
    ).resolves.toEqual({
      kind: "redirect",
      redirectTo: "/login?error=missing_profile",
      reason: "missing_profile",
      message: "Perfil de acesso nao encontrado.",
    });
  });

  it("returns the profile when it exists", async () => {
    const supabase = createSupabaseStub({
      user: { id: "user-1", email: "teacher@example.com" },
      profile: {
        id: "user-1",
        email: "teacher@example.com",
        role: "teacher",
        blocked: false,
      },
    });

    await expect(
      getProfileOrRedirect({
        createClient: async () => supabase,
      }),
    ).resolves.toEqual({
      kind: "profile",
      profile: {
        id: "user-1",
        email: "teacher@example.com",
        role: "teacher",
        blocked: false,
      },
    });
  });
});
