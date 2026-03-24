import { describe, expect, it } from "vitest";
import {
  createSupportSchema,
  updateSupportSchema,
} from "@/features/admin/supports/validation";

describe("supports validation", () => {
  it("accepts valid create payloads", () => {
    const parsed = createSupportSchema.safeParse({
      name: "Leitura guiada",
      agentId: "550e8400-e29b-41d4-a716-446655440000",
      modelId: "550e8400-e29b-41d4-a716-446655440001",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid uuids", () => {
    const parsed = createSupportSchema.safeParse({
      name: "Leitura guiada",
      agentId: "invalid",
      modelId: "invalid",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts partial updates", () => {
    const parsed = updateSupportSchema.safeParse({
      enabled: false,
    });

    expect(parsed.success).toBe(true);
  });
});
