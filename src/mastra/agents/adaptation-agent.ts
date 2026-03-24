import { Agent } from "@mastra/core/agent";
import type { ResolvedMastraModel } from "@/mastra/providers/provider-factory";

export function createAdaptationAgent(
  model: ResolvedMastraModel,
  instructions: string,
) {
  return new Agent({
    id: "adaptation-agent",
    name: "Adaptation Agent",
    instructions,
    model,
  });
}
