import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Importar após configurar env para evitar cache do módulo
describe("getConsultantBackend", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('deve retornar "mastra" quando CONSULTANT_BACKEND não está definido', async () => {
    delete process.env.CONSULTANT_BACKEND;
    const { getConsultantBackend } = await import("./consultant-backend");
    expect(getConsultantBackend()).toBe("mastra");
  });

  it('deve retornar "mastra" quando CONSULTANT_BACKEND = "mastra"', async () => {
    process.env.CONSULTANT_BACKEND = "mastra";
    const { getConsultantBackend } = await import("./consultant-backend");
    expect(getConsultantBackend()).toBe("mastra");
  });

  it('deve retornar "managed" quando CONSULTANT_BACKEND = "managed"', async () => {
    process.env.CONSULTANT_BACKEND = "managed";
    const { getConsultantBackend } = await import("./consultant-backend");
    expect(getConsultantBackend()).toBe("managed");
  });

  it('deve retornar "mastra" para valor desconhecido', async () => {
    process.env.CONSULTANT_BACKEND = "invalid";
    const { getConsultantBackend } = await import("./consultant-backend");
    expect(getConsultantBackend()).toBe("mastra");
  });
});
