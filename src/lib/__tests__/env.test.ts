import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getServerEnv, resetEnvCache } from "../env";

// Env vars base que sempre devem estar presentes
const BASE_ENV: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "anon-key",
  SUPABASE_SECRET_API_KEY: "service-key",
  ANTHROPIC_API_KEY: "sk-ant-abc",
  MANAGED_AGENT_ID: "agent_01abc",
  MANAGED_AGENT_ENVIRONMENT_ID: "env_01abc",
};

describe("getServerEnv", () => {
  beforeEach(() => {
    resetEnvCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetEnvCache();
  });

  it("deve passar quando todas as vars obrigatorias estao presentes", () => {
    for (const [key, value] of Object.entries(BASE_ENV)) {
      vi.stubEnv(key, value);
    }

    expect(() => getServerEnv()).not.toThrow();
    const env = getServerEnv();
    expect(env.MANAGED_AGENT_ID).toBe("agent_01abc");
    expect(env.ANTHROPIC_API_KEY).toBe("sk-ant-abc");
    expect(env.MANAGED_AGENT_ENVIRONMENT_ID).toBe("env_01abc");
  });

  it("deve falhar quando ANTHROPIC_API_KEY esta ausente", () => {
    for (const [key, value] of Object.entries(BASE_ENV)) {
      if (key !== "ANTHROPIC_API_KEY") vi.stubEnv(key, value);
    }

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });

  it("deve falhar quando MANAGED_AGENT_ID esta ausente", () => {
    for (const [key, value] of Object.entries(BASE_ENV)) {
      if (key !== "MANAGED_AGENT_ID") vi.stubEnv(key, value);
    }

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });

  it("deve falhar quando MANAGED_AGENT_ENVIRONMENT_ID esta ausente", () => {
    for (const [key, value] of Object.entries(BASE_ENV)) {
      if (key !== "MANAGED_AGENT_ENVIRONMENT_ID") vi.stubEnv(key, value);
    }

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });

  it("deve passar quando MANAGED_AGENT_MEMORY_STORE_ID esta ausente (opcional)", () => {
    for (const [key, value] of Object.entries(BASE_ENV)) {
      vi.stubEnv(key, value);
    }
    // MANAGED_AGENT_MEMORY_STORE_ID ausente — e opcional

    expect(() => getServerEnv()).not.toThrow();
  });

  it("deve passar quando MANAGED_AGENT_MEMORY_STORE_ID esta presente", () => {
    for (const [key, value] of Object.entries(BASE_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("MANAGED_AGENT_MEMORY_STORE_ID", "store_01abc");

    expect(() => getServerEnv()).not.toThrow();
    expect(getServerEnv().MANAGED_AGENT_MEMORY_STORE_ID).toBe("store_01abc");
  });
});
