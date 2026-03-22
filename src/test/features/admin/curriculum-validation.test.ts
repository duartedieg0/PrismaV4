import { describe, expect, it } from "vitest";
import {
  createEnabledNameEntitySchema,
  updateEnabledEntitySchema,
} from "@/features/admin/curriculum/validation";

describe("curriculum validation", () => {
  it("accepts a valid name entity", () => {
    const parsed = createEnabledNameEntitySchema.safeParse({
      name: "Matemática",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty names", () => {
    const parsed = createEnabledNameEntitySchema.safeParse({
      name: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts enabled toggles", () => {
    const parsed = updateEnabledEntitySchema.safeParse({
      enabled: true,
    });

    expect(parsed.success).toBe(true);
  });
});
