import type { AdminSupportView } from "@/features/admin/supports/contracts";

type SupportQueryRow = {
  id: string;
  name: string;
  agent_id: string;
  model_id: string | null;
  enabled: boolean;
  created_at: string;
  agents: { name: string } | { name: string }[] | null;
  ai_models: { name: string; model_id: string } | { name: string; model_id: string }[] | null;
};

function unwrap<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value;
}

export function toAdminSupportView(support: SupportQueryRow): AdminSupportView {
  const agent = unwrap(support.agents);
  const model = unwrap(support.ai_models);

  return {
    id: support.id,
    name: support.name,
    agentId: support.agent_id,
    modelId: support.model_id,
    enabled: support.enabled,
    createdAt: support.created_at,
    agentName: agent?.name ?? null,
    modelName: model?.name ?? null,
    modelIdentifier: model?.model_id ?? null,
  };
}
