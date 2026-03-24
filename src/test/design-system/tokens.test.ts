import { describe, expect, it } from "vitest";
import { layout } from "@/design-system/tokens";
import { colors } from "@/design-system/tokens";

describe("design system tokens", () => {
  it("exports the baseline semantic tokens for surfaces, text and states", () => {
    expect(colors.surface.canvas).toBe("#fafaf9");
    expect(colors.surface.default).toBe("#ffffff");
    expect(colors.text.primary).toBe("#0f172a");
    expect(colors.state.success).toBe("#059669");
  });

  it("exports layout tokens for containers and radius", () => {
    expect(layout.container.narrow).toBe("64rem");
    expect(layout.container.wide).toBe("90rem");
    expect(layout.radius.xl).toBe("1rem");
  });
});
