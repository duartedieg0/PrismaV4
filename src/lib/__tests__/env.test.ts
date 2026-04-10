import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getServerEnv, resetEnvCache } from "../env";

// Env vars base que sempre devem estar presentes
const BASE_ENV: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "anon-key",
  SUPABASE_SECRET_API_KEY: "service-key",
};

const MANAGED_ENV: Record<string, string> = {
  MANAGED_AGENT_ID: "agent_01abc",
  ANTHROPIC_API_KEY: "sk-ant-abc",
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

  it("deve passar quando vars do Managed Agents estão todas ausentes (Mastra continua)", () => {
    for (const [key, value] of Object.entries(BASE_ENV)) {
      vi.stubEnv(key, value);
    }

    expect(() => getServerEnv()).not.toThrow();
  });

  it("deve passar quando todas as vars do Managed Agents estão presentes", () => {
    for (const [key, value] of Object.entries({ ...BASE_ENV, ...MANAGED_ENV })) {
      vi.stubEnv(key, value);
    }

    expect(() => getServerEnv()).not.toThrow();
    const env = getServerEnv();
    expect(env.MANAGED_AGENT_ID).toBe("agent_01abc");
    expect(env.ANTHROPIC_API_KEY).toBe("sk-ant-abc");
  });

  it("deve falhar com mensagem clara quando MANAGED_AGENT_ID presente mas ANTHROPIC_API_KEY ausente", () => {
    for (const [key, value] of Object.entries(BASE_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("MANAGED_AGENT_ID", "agent_01abc");
    vi.stubEnv("MANAGED_AGENT_ENVIRONMENT_ID", "env_01abc");
    // ANTHROPIC_API_KEY ausente intencionalmente

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });

  it("deve falhar quando MANAGED_AGENT_ID presente mas MANAGED_AGENT_ENVIRONMENT_ID ausente", () => {
    for (const [key, value] of Object.entries(BASE_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("MANAGED_AGENT_ID", "agent_01abc");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-abc");
    // MANAGED_AGENT_ENVIRONMENT_ID ausente intencionalmente

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });

  it("deve passar quando MANAGED_AGENT_ID presente sem MANAGED_AGENT_MEMORY_STORE_ID (Memory Store opcional)", () => {
    for (const [key, value] of Object.entries(BASE_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("MANAGED_AGENT_ID", "agent_01abc");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-abc");
    vi.stubEnv("MANAGED_AGENT_ENVIRONMENT_ID", "env_01abc");
    // MANAGED_AGENT_MEMORY_STORE_ID ausente — agora é opcional

    expect(() => getServerEnv()).not.toThrow();
  });
});
