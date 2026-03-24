import type { AdminSupportRecord, AdminSupportView } from "@/features/admin/supports/contracts";

export function toAdminSupportView(support: AdminSupportRecord): AdminSupportView {
  return {
    id: support.id,
    name: support.name,
    agentId: support.agent_id,
    modelId: support.model_id,
    enabled: support.enabled,
    createdAt: support.created_at,
    agentName: support.agents?.name ?? null,
    modelName: support.ai_models?.name ?? null,
    modelIdentifier: support.ai_models?.model_id ?? null,
  };
}
