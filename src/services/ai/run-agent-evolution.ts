import type { EvolutionWorkflowResult } from "@/mastra/contracts/evolution-contracts";
import {
  createEvolveAgentWorkflow,
  runEvolveAgentWorkflow,
} from "@/mastra/workflows/evolve-agent-workflow";
import { createPrismaMastraRuntime } from "@/mastra/runtime";

type RunAgentEvolutionDependencies = Parameters<typeof createEvolveAgentWorkflow>[0];
type RunAgentEvolutionInput = Parameters<typeof runEvolveAgentWorkflow>[1];

export async function runAgentEvolution(
  input: RunAgentEvolutionInput,
  dependencies: RunAgentEvolutionDependencies,
) {
  const workflow = createEvolveAgentWorkflow(dependencies);
  const mastra = createPrismaMastraRuntime({
    evolveAgentWorkflow: workflow,
  });
  const registeredWorkflow = mastra.getWorkflowById(workflow.id) as typeof workflow;
  const result = await runEvolveAgentWorkflow(registeredWorkflow, input);

  if (result.status !== "success") {
    throw new Error("Falha ao executar o workflow de evolução.");
  }

  const payload = result.result as EvolutionWorkflowResult;

  if (payload.outcome === "error") {
    throw new Error(payload.failure.message);
  }

  return payload;
}
