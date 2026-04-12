// src/test/gateways/usage-pricing.test.ts
import { describe, expect, it } from "vitest";
import {
  MODEL_PRICING,
  getPricingForModel,
  calculateSimpleCost,
} from "@/gateways/managed-agents/usage";

describe("MODEL_PRICING", () => {
  it("has entries for sonnet, haiku and opus", () => {
    expect(MODEL_PRICING["claude-sonnet-4-6"]).toBeDefined();
    expect(MODEL_PRICING["claude-haiku-4-5"]).toBeDefined();
    expect(MODEL_PRICING["claude-opus-4-6"]).toBeDefined();
  });
});

describe("getPricingForModel", () => {
  it("returns exact pricing for a known model", () => {
    const pricing = getPricingForModel("claude-haiku-4-5");
    expect(pricing.inputPerMillion).toBe(0.08);
    expect(pricing.outputPerMillion).toBe(0.40);
  });

  it("falls back to sonnet pricing for unknown model", () => {
    const pricing = getPricingForModel("unknown-model-xyz");
    expect(pricing).toEqual(MODEL_PRICING["claude-sonnet-4-6"]);
  });
});

describe("calculateSimpleCost", () => {
  it("calculates cost correctly for sonnet", () => {
    const cost = calculateSimpleCost(
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      "claude-sonnet-4-6",
    );
    expect(cost).toBeCloseTo(4.80); // 0.80 + 4.00
  });

  it("calculates cost correctly for haiku", () => {
    const cost = calculateSimpleCost(
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      "claude-haiku-4-5",
    );
    expect(cost).toBeCloseTo(0.48); // 0.08 + 0.40
  });

  it("returns zero for zero tokens", () => {
    const cost = calculateSimpleCost(
      { inputTokens: 0, outputTokens: 0 },
      "claude-sonnet-4-6",
    );
    expect(cost).toBe(0);
  });
});
