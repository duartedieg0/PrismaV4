import { describe, expect, it } from "vitest";
import {
  createModelSchema,
  updateModelSchema,
} from "@/features/admin/models/validation";

describe("models validation", () => {
  it("accepts a valid create payload", () => {
    const parsed = createModelSchema.safeParse({
      name: "GPT-5.4",
      provider: "openai",
      baseUrl: "https://example.com/v1",
      apiKey: "secret",
      modelId: "gpt-5.4",
      isDefault: true,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid create payloads", () => {
    const parsed = createModelSchema.safeParse({
      name: "",
      provider: "",
      baseUrl: "invalid-url",
      apiKey: "",
      modelId: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts partial updates", () => {
    const parsed = updateModelSchema.safeParse({
      enabled: false,
      systemRole: "evolution",
    });

    expect(parsed.success).toBe(true);
  });
});
