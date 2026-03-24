import { describe, expect, it } from "vitest";
import {
  createAgentSchema,
  updateAgentSchema,
} from "@/features/admin/agents/validation";

describe("agents validation", () => {
  it("accepts valid create payloads", () => {
    const parsed = createAgentSchema.safeParse({
      name: "Agente BNCC",
      objective: "Analisar aderência pedagógica.",
      prompt: "Prompt do agente",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty prompts", () => {
    const parsed = createAgentSchema.safeParse({
      name: "Agente BNCC",
      prompt: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts explicit version updates", () => {
    const parsed = updateAgentSchema.safeParse({
      version: 2,
      enabled: false,
    });

    expect(parsed.success).toBe(true);
  });
});
