import { describe, expect, it } from "vitest";
import { layoutTokens } from "@/design-system/tokens/layout";
import { semanticTokens } from "@/design-system/tokens/semantic-tokens";

describe("design system tokens", () => {
  it("exports the baseline semantic tokens for surfaces, text and states", () => {
    expect(semanticTokens.background.canvas).toBe("#f8f6f0");
    expect(semanticTokens.surface.overlay).toBe("rgba(255, 253, 248, 0.92)");
    expect(semanticTokens.text.primary).toBe("#1f2b28");
    expect(semanticTokens.state.processing).toBe("#0d7c66");
  });

  it("exports layout tokens for containers and spacing", () => {
    expect(layoutTokens.container.reading).toBe("62rem");
    expect(layoutTokens.container.wide).toBe("80rem");
    expect(layoutTokens.space.section).toBe("clamp(2.75rem, 5vw, 5rem)");
  });
});
