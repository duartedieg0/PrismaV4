import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().min(1, "O nome do agente é obrigatório.").max(100),
  objective: z.string().max(500).optional(),
  prompt: z.string().min(1, "O prompt é obrigatório.").max(50000),
  enabled: z.boolean().optional(),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  objective: z.string().max(500).nullable().optional(),
  prompt: z.string().min(1).max(50000).optional(),
  enabled: z.boolean().optional(),
  version: z.number().int().min(1).optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
