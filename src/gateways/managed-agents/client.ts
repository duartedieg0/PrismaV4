import Anthropic from "@anthropic-ai/sdk";
import type { AgentConfig } from "./types";

/**
 * Cria uma instância do Anthropic SDK.
 * O SDK lê ANTHROPIC_API_KEY automaticamente de process.env.
 */
export function createAnthropicClient(): Anthropic {
  return new Anthropic();
}

/**
 * Lê os IDs dos recursos provisionados de process.env.
 * Seguro chamar apenas após a validação de startup (env.ts) confirmar que
 * MANAGED_AGENT_ID está presente — o que garante as demais vars.
 */
export function getAgentConfig(): AgentConfig {
  return {
    agentId: process.env.MANAGED_AGENT_ID!,
    environmentId: process.env.MANAGED_AGENT_ENVIRONMENT_ID!,
    memoryStoreId: process.env.MANAGED_AGENT_MEMORY_STORE_ID,
  };
}
