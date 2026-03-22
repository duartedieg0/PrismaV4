import { z } from "zod";
import { createAgentEvolutionAgent } from "@/mastra/agents/agent-evolution-agent";
import { createMastraModel } from "@/mastra/providers/provider-factory";
import type { AiModelRecord } from "@/mastra/providers/model-registry";

const evolutionResponseSchema = z.object({
  suggestedPrompt: z.string().min(1),
  commentary: z.string().min(1),
});

export async function runAgentEvolutionAgent(input: {
  prompt: string;
  model: AiModelRecord;
}) {
  const agent = createAgentEvolutionAgent(createMastraModel(input.model));
  const response = await agent.generate(input.prompt, {
    structuredOutput: {
      schema: evolutionResponseSchema,
    },
  });

  const parsed = evolutionResponseSchema.safeParse(response.object);

  if (!parsed.success) {
    throw new Error("O runtime de evolução retornou uma resposta inválida.");
  }

  return parsed.data;
}
