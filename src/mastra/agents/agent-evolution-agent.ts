import { Agent } from "@mastra/core/agent";
import type { ResolvedMastraModel } from "@/mastra/providers/provider-factory";
import { EVOLUTION_AGENT_INSTRUCTIONS } from "@/mastra/prompts/evolution-prompt";

export function createAgentEvolutionAgent(model: ResolvedMastraModel) {
  return new Agent({
    id: "agent-evolution-agent",
    name: "Agent Evolution Agent",
    instructions: EVOLUTION_AGENT_INSTRUCTIONS,
    model,
  });
}
