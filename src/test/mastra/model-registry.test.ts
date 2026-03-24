import { describe, expect, it } from "vitest";
import {
  ModelResolutionError,
  resolveAnalysisModel,
  resolveExtractionModel,
  toMastraModelId,
  type AiModelRecord,
} from "@/mastra/providers/model-registry";

const enabledDefaultModel: AiModelRecord = {
  id: "model-default",
  name: "GPT 5.4",
  provider: "openai",
  modelId: "gpt-5.4",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "secret",
  enabled: true,
  isDefault: true,
};

const enabledSupportModel: AiModelRecord = {
  id: "model-support",
  name: "GPT 5.4 Mini",
  provider: "openai",
  modelId: "gpt-5.4-mini",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "secret",
  enabled: true,
  isDefault: false,
};

describe("mastra model registry", () => {
  it("resolves the enabled default model for extraction", () => {
    const model = resolveExtractionModel({
      models: [enabledSupportModel, enabledDefaultModel],
    });

    expect(model.id).toBe("model-default");
    expect(toMastraModelId(model)).toBe("openai/gpt-5.4");
  });

  it("resolves a support-specific model for adaptation when enabled", () => {
    const model = resolveAnalysisModel({
      models: [enabledDefaultModel, enabledSupportModel],
      supportModelId: "model-support",
    });

    expect(model.id).toBe("model-support");
    expect(toMastraModelId(model)).toBe("openai/gpt-5.4-mini");
  });

  it("falls back to the default model when the support has no override", () => {
    const model = resolveAnalysisModel({
      models: [enabledDefaultModel, enabledSupportModel],
      supportModelId: null,
    });

    expect(model.id).toBe("model-default");
  });

  it("rejects disabled support models explicitly instead of silently falling back", () => {
    expect(() =>
      resolveAnalysisModel({
        models: [
          enabledDefaultModel,
          {
            ...enabledSupportModel,
            id: "model-disabled",
            enabled: false,
          },
        ],
        supportModelId: "model-disabled",
      }),
    ).toThrowError(ModelResolutionError);
  });

  it("fails when no enabled default or fallback model exists", () => {
    expect(() =>
      resolveExtractionModel({
        models: [
          {
            ...enabledDefaultModel,
            enabled: false,
            isDefault: false,
          },
        ],
      }),
    ).toThrowError("Nenhum modelo de IA habilitado foi encontrado.");
  });
});
