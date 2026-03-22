import { describe, expect, it } from "vitest";
import {
  buildModelPatch,
  selectEvolutionModel,
  toAdminModelView,
} from "@/features/admin/models/service";

describe("admin models integration helpers", () => {
  it("masks secrets and preserves model governance metadata", () => {
    const view = toAdminModelView({
      id: "model-1",
      name: "GPT",
      provider: "openai",
      base_url: "https://example.com",
      api_key: "secret-123456",
      model_id: "gpt-5.4",
      enabled: true,
      is_default: true,
      system_role: "evolution",
      created_at: "2026-03-21T00:00:00.000Z",
    });

    expect(view.apiKeyMasked).toBe("sec...3456");
    expect(view.isDefault).toBe(true);
    expect(view.systemRole).toBe("evolution");
  });

  it("prefers the dedicated evolution model when resolving evolution runtime", () => {
    const model = selectEvolutionModel([
      {
        id: "model-1",
        name: "Default",
        provider: "openai",
        base_url: "https://example.com",
        api_key: "secret",
        model_id: "gpt-5.4",
        enabled: true,
        is_default: true,
        system_role: null,
        created_at: "2026-03-21T00:00:00.000Z",
      },
      {
        id: "model-2",
        name: "Evolution",
        provider: "openai",
        base_url: "https://example.com",
        api_key: "secret",
        model_id: "gpt-5.4-mini",
        enabled: true,
        is_default: false,
        system_role: "evolution",
        created_at: "2026-03-21T00:00:00.000Z",
      },
    ]);

    expect(model?.id).toBe("model-2");
  });

  it("builds patches with server column names", () => {
    expect(
      buildModelPatch({
        baseUrl: "https://example.com/v2",
        modelId: "gpt-5.4",
      }),
    ).toEqual({
      base_url: "https://example.com/v2",
      model_id: "gpt-5.4",
    });
  });
});
