import { Agent } from "@mastra/core/agent";
import type { ResolvedMastraModel } from "@/mastra/providers/provider-factory";
import { EXTRACTION_AGENT_INSTRUCTIONS } from "@/mastra/prompts/extraction-prompt";

export function createExtractionAgent(model: ResolvedMastraModel) {
  return new Agent({
    id: "extraction-agent",
    name: "Extraction Agent",
    instructions: EXTRACTION_AGENT_INSTRUCTIONS,
    model,
  });
}
