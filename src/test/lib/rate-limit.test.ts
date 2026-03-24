import { describe, expect, it, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetStore,
  resolveRateLimitGroup,
  getRateLimitRule,
} from "@/lib/rate-limit";

beforeEach(() => {
  resetStore();
});

describe("checkRateLimit", () => {
  const rule = { windowMs: 60_000, maxRequests: 3 };
  const now = 1_000_000;

  it("allows requests within the limit", () => {
    const r1 = checkRateLimit("ip:group", rule, now);
    const r2 = checkRateLimit("ip:group", rule, now + 100);
    const r3 = checkRateLimit("ip:group", rule, now + 200);

    expect(r1).toEqual({ allowed: true, remaining: 2, retryAfterSeconds: 0 });
    expect(r2).toEqual({ allowed: true, remaining: 1, retryAfterSeconds: 0 });
    expect(r3).toEqual({ allowed: true, remaining: 0, retryAfterSeconds: 0 });
  });

  it("blocks requests that exceed the limit", () => {
    checkRateLimit("ip:group", rule, now);
    checkRateLimit("ip:group", rule, now + 100);
    checkRateLimit("ip:group", rule, now + 200);

    const blocked = checkRateLimit("ip:group", rule, now + 300);

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window expires", () => {
    checkRateLimit("ip:group", rule, now);
    checkRateLimit("ip:group", rule, now + 100);
    checkRateLimit("ip:group", rule, now + 200);

    const afterWindow = now + 60_001;
    const result = checkRateLimit("ip:group", rule, afterWindow);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("isolates different keys", () => {
    checkRateLimit("ip1:auth", rule, now);
    checkRateLimit("ip1:auth", rule, now);
    checkRateLimit("ip1:auth", rule, now);

    const ip1Blocked = checkRateLimit("ip1:auth", rule, now);
    const ip2Allowed = checkRateLimit("ip2:auth", rule, now);

    expect(ip1Blocked.allowed).toBe(false);
    expect(ip2Allowed.allowed).toBe(true);
  });

  it("returns correct retryAfterSeconds", () => {
    checkRateLimit("ip:group", rule, now);
    checkRateLimit("ip:group", rule, now);
    checkRateLimit("ip:group", rule, now);

    const halfwayThrough = now + 30_000;
    const blocked = checkRateLimit("ip:group", rule, halfwayThrough);

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(30);
  });
});

describe("resolveRateLimitGroup", () => {
  it("classifies auth routes", () => {
    expect(resolveRateLimitGroup("/login", "GET")).toBe("auth");
    expect(resolveRateLimitGroup("/login/callback", "GET")).toBe("auth");
  });

  it("classifies exam upload", () => {
    expect(resolveRateLimitGroup("/api/exams", "POST")).toBe("upload");
  });

  it("classifies exam GET as read, not upload", () => {
    expect(resolveRateLimitGroup("/api/exams", "GET")).toBe("read");
  });

  it("classifies admin routes", () => {
    expect(resolveRateLimitGroup("/api/admin/agents", "GET")).toBe("admin");
    expect(resolveRateLimitGroup("/api/admin/models", "POST")).toBe("admin");
  });

  it("classifies GET requests as read", () => {
    expect(resolveRateLimitGroup("/api/exams/123/status", "GET")).toBe("read");
    expect(resolveRateLimitGroup("/dashboard", "GET")).toBe("read");
  });

  it("classifies other methods as default", () => {
    expect(resolveRateLimitGroup("/api/exams/123/answers", "POST")).toBe("default");
    expect(resolveRateLimitGroup("/api/exams/123/feedback", "PUT")).toBe("default");
  });
});

describe("getRateLimitRule", () => {
  it("returns stricter limits for auth", () => {
    const auth = getRateLimitRule("auth");
    const defaultRule = getRateLimitRule("default");

    expect(auth.maxRequests).toBeLessThan(defaultRule.maxRequests);
  });

  it("returns stricter limits for upload", () => {
    const upload = getRateLimitRule("upload");

    expect(upload.maxRequests).toBe(5);
    expect(upload.windowMs).toBe(300_000);
  });

  it("returns all defined groups", () => {
    expect(getRateLimitRule("auth")).toBeDefined();
    expect(getRateLimitRule("upload")).toBeDefined();
    expect(getRateLimitRule("admin")).toBeDefined();
    expect(getRateLimitRule("read")).toBeDefined();
    expect(getRateLimitRule("default")).toBeDefined();
  });
});
