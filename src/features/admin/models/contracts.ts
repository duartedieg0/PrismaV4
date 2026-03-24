export type AdminModelRecord = {
  id: string;
  name: string;
  provider: string;
  base_url: string;
  api_key: string;
  model_id: string;
  enabled: boolean;
  is_default: boolean;
  system_role: string | null;
  created_at: string;
};

export type AdminModelView = {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  apiKeyMasked: string;
  modelId: string;
  enabled: boolean;
  isDefault: boolean;
  systemRole: string | null;
  createdAt: string;
};
