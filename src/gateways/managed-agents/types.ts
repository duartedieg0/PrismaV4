export interface ManagedSession {
  id: string;
  agentId: string;
  createdAt: string;
}

export interface ManagedEvent {
  type: string;
  [key: string]: unknown;
}

export interface SessionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AgentConfig {
  agentId: string;
  environmentId: string;
  memoryStoreId: string;
}
