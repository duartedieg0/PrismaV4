export type AdminSupportRecord = {
  id: string;
  name: string;
  agent_id: string;
  model_id: string | null;
  enabled: boolean;
  created_at: string;
  agents: { name: string } | null;
  ai_models: { name: string; model_id: string } | null;
};

export type AdminSupportView = {
  id: string;
  name: string;
  agentId: string;
  modelId: string | null;
  enabled: boolean;
  createdAt: string;
  agentName: string | null;
  modelName: string | null;
  modelIdentifier: string | null;
};
