import { Agent } from "@mastra/core/agent";
import type { ResolvedMastraModel } from "@/mastra/providers/provider-factory";
import { BNCC_AGENT_INSTRUCTIONS } from "@/mastra/prompts/bncc-prompt";

export function createBnccAnalysisAgent(model: ResolvedMastraModel) {
  return new Agent({
    id: "bncc-analysis-agent",
    name: "BNCC Analysis Agent",
    instructions: BNCC_AGENT_INSTRUCTIONS,
    model,
  });
}
