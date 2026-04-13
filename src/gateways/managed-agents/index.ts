// server-only — não importar em componentes client ou arquivos com "use client"
export { createTeaConsultantGateway } from "./tea-consultant";
export type { TeaConsultantGateway } from "./tea-consultant";
export { createAnthropicClient, getAgentConfig } from "./client";
export {
  ManagedAgentError,
  SessionNotFoundError,
  SessionStreamError,
} from "./errors";
export type {
  ManagedSession,
  ManagedEvent,
  SessionMessage,
  AgentConfig,
} from "./types";
export { syncSessionUsage, getPricingForModel, calculateSimpleCost } from "./usage";
export type { ModelPricing } from "./usage";
