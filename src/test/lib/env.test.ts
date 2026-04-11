import { describe, expect, it, vi, beforeEach } from "vitest";
import { getServerEnv, resetEnvCache } from "@/lib/env";

beforeEach(() => {
  resetEnvCache();
  vi.unstubAllEnvs();
});

describe("getServerEnv", () => {
  it("validates successfully with all required vars", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "eyJhbGciOi...");
    vi.stubEnv("SUPABASE_SECRET_API_KEY", "secret-key-123");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-abc");
    vi.stubEnv("MANAGED_AGENT_ID", "agent_01abc");
    vi.stubEnv("MANAGED_AGENT_ENVIRONMENT_ID", "env_01abc");

    const env = getServerEnv();

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://abc.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe("eyJhbGciOi...");
    expect(env.SUPABASE_SECRET_API_KEY).toBe("secret-key-123");
    expect(env.MASTRA_LOG_LEVEL).toBe("info");
  });

  it("throws when SUPABASE_URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "key");
    vi.stubEnv("SUPABASE_SECRET_API_KEY", "secret");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-abc");
    vi.stubEnv("MANAGED_AGENT_ID", "agent_01abc");
    vi.stubEnv("MANAGED_AGENT_ENVIRONMENT_ID", "env_01abc");

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });

  it("throws when SUPABASE_URL is not a valid URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-url");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "key");
    vi.stubEnv("SUPABASE_SECRET_API_KEY", "secret");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-abc");
    vi.stubEnv("MANAGED_AGENT_ID", "agent_01abc");
    vi.stubEnv("MANAGED_AGENT_ENVIRONMENT_ID", "env_01abc");

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });

  it("throws when SUPABASE_SECRET_API_KEY is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "key");
    vi.stubEnv("SUPABASE_SECRET_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-abc");
    vi.stubEnv("MANAGED_AGENT_ID", "agent_01abc");
    vi.stubEnv("MANAGED_AGENT_ENVIRONMENT_ID", "env_01abc");

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });

  it("falls back to ANON_KEY when PUBLISHABLE_KEY is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SECRET_API_KEY", "secret");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-abc");
    vi.stubEnv("MANAGED_AGENT_ID", "agent_01abc");
    vi.stubEnv("MANAGED_AGENT_ENVIRONMENT_ID", "env_01abc");

    const env = getServerEnv();

    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe("anon-key");
  });

  it("accepts optional SENTRY_DSN", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "key");
    vi.stubEnv("SUPABASE_SECRET_API_KEY", "secret");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-abc");
    vi.stubEnv("MANAGED_AGENT_ID", "agent_01abc");
    vi.stubEnv("MANAGED_AGENT_ENVIRONMENT_ID", "env_01abc");
    vi.stubEnv("SENTRY_DSN", "https://abc@sentry.io/123");

    const env = getServerEnv();

    expect(env.SENTRY_DSN).toBe("https://abc@sentry.io/123");
  });

  it("defaults MASTRA_LOG_LEVEL to info", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "key");
    vi.stubEnv("SUPABASE_SECRET_API_KEY", "secret");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-abc");
    vi.stubEnv("MANAGED_AGENT_ID", "agent_01abc");
    vi.stubEnv("MANAGED_AGENT_ENVIRONMENT_ID", "env_01abc");

    const env = getServerEnv();

    expect(env.MASTRA_LOG_LEVEL).toBe("info");
  });

  it("caches the result across calls", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "key");
    vi.stubEnv("SUPABASE_SECRET_API_KEY", "secret");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-abc");
    vi.stubEnv("MANAGED_AGENT_ID", "agent_01abc");
    vi.stubEnv("MANAGED_AGENT_ENVIRONMENT_ID", "env_01abc");

    const first = getServerEnv();
    const second = getServerEnv();

    expect(first).toBe(second);
  });

  it("throws when ANTHROPIC_API_KEY is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "key");
    vi.stubEnv("SUPABASE_SECRET_API_KEY", "secret");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("MANAGED_AGENT_ID", "agent_01abc");
    vi.stubEnv("MANAGED_AGENT_ENVIRONMENT_ID", "env_01abc");

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });

  it("throws when MANAGED_AGENT_ID is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "key");
    vi.stubEnv("SUPABASE_SECRET_API_KEY", "secret");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-abc");
    vi.stubEnv("MANAGED_AGENT_ID", "");
    vi.stubEnv("MANAGED_AGENT_ENVIRONMENT_ID", "env_01abc");

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });

  it("throws when MANAGED_AGENT_ENVIRONMENT_ID is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "key");
    vi.stubEnv("SUPABASE_SECRET_API_KEY", "secret");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-abc");
    vi.stubEnv("MANAGED_AGENT_ID", "agent_01abc");
    vi.stubEnv("MANAGED_AGENT_ENVIRONMENT_ID", "");

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });
});
