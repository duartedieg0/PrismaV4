import { Agent } from "@mastra/core/agent";
import type { ResolvedMastraModel } from "@/mastra/providers/provider-factory";
import { BLOOM_AGENT_INSTRUCTIONS } from "@/mastra/prompts/bloom-prompt";

export function createBloomAnalysisAgent(model: ResolvedMastraModel) {
  return new Agent({
    id: "bloom-analysis-agent",
    name: "Bloom Analysis Agent",
    instructions: BLOOM_AGENT_INSTRUCTIONS,
    model,
  });
}
