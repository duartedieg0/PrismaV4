import type { AdminModelRecord } from "@/features/admin/models/contracts";
import type { EvolutionFeedbackView, EvolutionSuggestion } from "@/features/admin/agents/evolution/contracts";
import { runAgentEvolution } from "@/services/ai/run-agent-evolution";
import { runAgentEvolutionAgent } from "@/mastra/agents/agent-evolution-runner";

export async function suggestAgentEvolution(input: {
  agentId: string;
  agentName: string;
  objective: string | null;
  currentPrompt: string;
  currentVersion: number;
  model: AdminModelRecord;
  feedbacks: EvolutionFeedbackView[];
  initiatedBy: string;
  persistEvolution: (payload: {
    agentId: string;
    originalPrompt: string;
    suggestedPrompt: string;
    commentary: string;
    feedbackIds: string[];
    currentVersion: number;
    suggestedVersion: number;
    initiatedBy: string;
    modelId: string;
    promptVersion: string;
  }) => Promise<{ evolutionId: string }>;
}): Promise<EvolutionSuggestion> {
  const result = await runAgentEvolution(
    {
      agentId: input.agentId,
      agentName: input.agentName,
      objective: input.objective,
      currentPrompt: input.currentPrompt,
      currentVersion: input.currentVersion,
      initiatedBy: input.initiatedBy,
      model: {
        id: input.model.id,
        name: input.model.name,
        provider: input.model.provider,
        modelId: input.model.model_id,
        baseUrl: input.model.base_url,
        apiKey: input.model.api_key,
        enabled: input.model.enabled,
        isDefault: input.model.is_default,
      },
      feedbacks: input.feedbacks,
    },
    {
      runEvolution: runAgentEvolutionAgent,
      persistEvolution: input.persistEvolution,
      registerEvent: async () => {},
    },
  );

  return {
    evolutionId: result.evolutionId,
    originalPrompt: result.originalPrompt,
    suggestedPrompt: result.suggestedPrompt,
    commentary: result.commentary,
    currentVersion: result.currentVersion,
    suggestedVersion: result.suggestedVersion,
  };
}
