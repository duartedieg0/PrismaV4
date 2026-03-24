import { describe, expect, it } from "vitest";
import {
  sanitizeRedirectPath,
  buildCallbackRedirect,
  resolveCallbackRedirect,
} from "@/features/auth/callback";

describe("sanitizeRedirectPath", () => {
  it("allows valid relative paths", () => {
    expect(sanitizeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/exams/123/result")).toBe("/exams/123/result");
    expect(sanitizeRedirectPath("/config")).toBe("/config");
  });

  it("rejects protocol-relative URLs (//attacker.com)", () => {
    expect(sanitizeRedirectPath("//attacker.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("//evil.com/phish")).toBe("/dashboard");
  });

  it("rejects absolute URLs with protocol", () => {
    expect(sanitizeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("http://attacker.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("javascript://alert(1)")).toBe("/dashboard");
  });

  it("rejects paths that do not start with /", () => {
    expect(sanitizeRedirectPath("evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("")).toBe("/dashboard");
    expect(sanitizeRedirectPath("dashboard")).toBe("/dashboard");
  });

  it("rejects paths containing :// anywhere", () => {
    expect(sanitizeRedirectPath("/redirect?url=https://evil.com")).toBe("/dashboard");
  });
});

describe("buildCallbackRedirect", () => {
  it("builds login redirect with error parameter", () => {
    const result = buildCallbackRedirect({
      origin: "https://app.example.com",
      error: "no_code",
    });

    expect(result).toBe("https://app.example.com/login?error=no_code");
  });

  it("builds login redirect for auth_failed", () => {
    const result = buildCallbackRedirect({
      origin: "https://app.example.com",
      error: "auth_failed",
    });

    expect(result).toBe("https://app.example.com/login?error=auth_failed");
  });
});

describe("resolveCallbackRedirect", () => {
  const origin = "https://app.example.com";

  it("redirects blocked users to /blocked", () => {
    const result = resolveCallbackRedirect({
      origin,
      next: "/dashboard",
      role: "teacher",
      blocked: true,
    });

    expect(result).toBe(`${origin}/blocked`);
  });

  it("redirects admin users to /config", () => {
    const result = resolveCallbackRedirect({
      origin,
      next: "/dashboard",
      role: "admin",
      blocked: false,
    });

    expect(result).toBe(`${origin}/config`);
  });

  it("redirects teachers to the sanitized next path", () => {
    const result = resolveCallbackRedirect({
      origin,
      next: "/exams/123/result",
      role: "teacher",
      blocked: false,
    });

    expect(result).toBe(`${origin}/exams/123/result`);
  });

  it("sanitizes malicious next parameter", () => {
    const result = resolveCallbackRedirect({
      origin,
      next: "//attacker.com",
      role: "teacher",
      blocked: false,
    });

    expect(result).toBe(`${origin}/dashboard`);
  });

  it("sanitizes next with protocol injection", () => {
    const result = resolveCallbackRedirect({
      origin,
      next: "https://evil.com",
      role: "teacher",
      blocked: false,
    });

    expect(result).toBe(`${origin}/dashboard`);
  });
});
