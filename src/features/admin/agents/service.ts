import type { AdminAgentRecord, AdminAgentView } from "@/features/admin/agents/contracts";
import type { UpdateAgentInput } from "@/features/admin/agents/validation";

export function toAdminAgentView(agent: AdminAgentRecord): AdminAgentView {
  return {
    id: agent.id,
    name: agent.name,
    objective: agent.objective,
    prompt: agent.prompt,
    version: agent.version,
    enabled: agent.enabled,
    createdAt: agent.created_at,
    updatedAt: agent.updated_at,
  };
}

export function buildAgentPatch(input: UpdateAgentInput) {
  const patch: Record<string, unknown> = {};

  if (input.name !== undefined) patch.name = input.name;
  if (input.objective !== undefined) patch.objective = input.objective;
  if (input.prompt !== undefined) patch.prompt = input.prompt;
  if (input.enabled !== undefined) patch.enabled = input.enabled;
  if (input.version !== undefined) patch.version = input.version;

  return patch;
}
