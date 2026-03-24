import { describe, expect, it } from "vitest";
import { maskSecret } from "@/features/admin/shared/mask-secret";

describe("maskSecret", () => {
  it("masks short secrets entirely", () => {
    expect(maskSecret("1234567")).toBe("••••••••");
  });

  it("preserves only the start and end of long secrets", () => {
    expect(maskSecret("sb_secret_1234567890")).toBe("sb_...7890");
  });
});
