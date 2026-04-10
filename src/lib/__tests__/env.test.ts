import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getServerEnv, resetEnvCache } from "../env";

// Env vars base que sempre devem estar presentes
const BASE_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "anon-key",
  SUPABASE_SECRET_API_KEY: "service-key",
};

const MANAGED_ENV = {
  MANAGED_AGENT_ID: "agent_01abc",
  ANTHROPIC_API_KEY: "sk-ant-abc",
  MANAGED_AGENT_ENVIRONMENT_ID: "env_01abc",
  MANAGED_AGENT_MEMORY_STORE_ID: "memstore_01abc",
};

describe("getServerEnv", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    resetEnvCache();
  });

  afterEach(() => {
    // Restaurar process.env
    Object.keys(process.env).forEach((key) => delete process.env[key]);
    Object.assign(process.env, originalEnv);
    resetEnvCache();
  });

  it("deve passar quando vars do Managed Agents estão todas ausentes (Mastra continua)", () => {
    Object.assign(process.env, BASE_ENV);

    expect(() => getServerEnv()).not.toThrow();
  });

  it("deve passar quando todas as vars do Managed Agents estão presentes", () => {
    Object.assign(process.env, BASE_ENV, MANAGED_ENV);

    expect(() => getServerEnv()).not.toThrow();
    const env = getServerEnv();
    expect(env.MANAGED_AGENT_ID).toBe("agent_01abc");
    expect(env.ANTHROPIC_API_KEY).toBe("sk-ant-abc");
  });

  it("deve falhar com mensagem clara quando MANAGED_AGENT_ID presente mas ANTHROPIC_API_KEY ausente", () => {
    Object.assign(process.env, BASE_ENV, {
      MANAGED_AGENT_ID: "agent_01abc",
      MANAGED_AGENT_ENVIRONMENT_ID: "env_01abc",
      MANAGED_AGENT_MEMORY_STORE_ID: "memstore_01abc",
      // ANTHROPIC_API_KEY ausente intencionalmente
    });

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });

  it("deve falhar quando MANAGED_AGENT_ID presente mas MANAGED_AGENT_ENVIRONMENT_ID ausente", () => {
    Object.assign(process.env, BASE_ENV, {
      MANAGED_AGENT_ID: "agent_01abc",
      ANTHROPIC_API_KEY: "sk-ant-abc",
      MANAGED_AGENT_MEMORY_STORE_ID: "memstore_01abc",
      // MANAGED_AGENT_ENVIRONMENT_ID ausente intencionalmente
    });

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });
});
