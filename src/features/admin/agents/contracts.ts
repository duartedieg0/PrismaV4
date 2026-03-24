export type AdminAgentRecord = {
  id: string;
  name: string;
  objective: string | null;
  prompt: string;
  version: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminAgentView = {
  id: string;
  name: string;
  objective: string | null;
  prompt: string;
  version: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};
