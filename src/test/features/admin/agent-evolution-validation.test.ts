import { describe, expect, it } from "vitest";
import {
  evolveAgentSchema,
  resolveEvolutionSchema,
} from "@/features/admin/agents/evolution/validation";

describe("agent evolution validation", () => {
  it("accepts valid feedback selection payloads", () => {
    const parsed = evolveAgentSchema.safeParse({
      feedbackIds: ["550e8400-e29b-41d4-a716-446655440000"],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty feedback selection payloads", () => {
    const parsed = evolveAgentSchema.safeParse({
      feedbackIds: [],
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts valid acceptance decisions", () => {
    const parsed = resolveEvolutionSchema.safeParse({
      evolutionId: "550e8400-e29b-41d4-a716-446655440000",
      accepted: true,
      suggestedPrompt: "Novo prompt",
    });

    expect(parsed.success).toBe(true);
  });
});
