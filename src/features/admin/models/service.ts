import type { AdminModelRecord, AdminModelView } from "@/features/admin/models/contracts";
import type { UpdateModelInput } from "@/features/admin/models/validation";
import { maskSecret } from "@/features/admin/shared/mask-secret";

export function toAdminModelView(model: AdminModelRecord): AdminModelView {
  return {
    id: model.id,
    name: model.name,
    provider: model.provider,
    baseUrl: model.base_url,
    apiKeyMasked: maskSecret(model.api_key),
    modelId: model.model_id,
    enabled: model.enabled,
    isDefault: model.is_default,
    systemRole: model.system_role,
    createdAt: model.created_at,
  };
}

export function buildModelPatch(input: UpdateModelInput) {
  const patch: Record<string, unknown> = {};

  if (input.name !== undefined) patch.name = input.name;
  if (input.provider !== undefined) patch.provider = input.provider;
  if (input.baseUrl !== undefined) patch.base_url = input.baseUrl;
  if (input.apiKey !== undefined) patch.api_key = input.apiKey;
  if (input.modelId !== undefined) patch.model_id = input.modelId;
  if (input.enabled !== undefined) patch.enabled = input.enabled;
  if (input.isDefault !== undefined) patch.is_default = input.isDefault;
  if (input.systemRole !== undefined) patch.system_role = input.systemRole;

  return patch;
}

export function selectEvolutionModel(models: AdminModelRecord[]) {
  return (
    models.find((model) => model.system_role === "evolution" && model.enabled) ??
    models.find((model) => model.is_default && model.enabled) ??
    models.find((model) => model.enabled) ??
    null
  );
}
