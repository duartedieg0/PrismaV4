import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCallbackRedirect, resolveCallbackRedirect } from "@/features/auth/callback";
import LoginPage from "@/app/(public)/login/page";

const signInWithOAuth = vi.fn();

vi.mock("@/gateways/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth,
    },
  }),
}));

describe("phase 2 login flow", () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
  });

  it("starts Google OAuth from the login page", async () => {
    signInWithOAuth.mockResolvedValue({});

    render(<LoginPage />);
    fireEvent.click(
      screen.getByRole("button", {
        name: /entrar com google/i,
      }),
    );

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/login/callback",
      },
    });
  });

  it("handles callback failure modes deterministically", () => {
    expect(
      buildCallbackRedirect({
        origin: "http://localhost:3000",
        error: "no_code",
      }),
    ).toBe("http://localhost:3000/login?error=no_code");

    expect(
      buildCallbackRedirect({
        origin: "http://localhost:3000",
        error: "auth_failed",
      }),
    ).toBe("http://localhost:3000/login?error=auth_failed");
  });

  it("redirects blocked users and admins from the callback", () => {
    expect(
      resolveCallbackRedirect({
        origin: "http://localhost:3000",
        next: "/dashboard",
        role: "admin",
        blocked: false,
      }),
    ).toBe("http://localhost:3000/config");

    expect(
      resolveCallbackRedirect({
        origin: "http://localhost:3000",
        next: "/dashboard",
        role: "teacher",
        blocked: true,
      }),
    ).toBe("http://localhost:3000/blocked");
  });

  it("honors the next parameter for teachers", () => {
    expect(
      resolveCallbackRedirect({
        origin: "http://localhost:3000",
        next: "/exams/new",
        role: "teacher",
        blocked: false,
      }),
    ).toBe("http://localhost:3000/exams/new");
  });
});
