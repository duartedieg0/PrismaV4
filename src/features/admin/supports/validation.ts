import { z } from "zod";

export const createSupportSchema = z.object({
  name: z.string().min(1, "O nome do apoio é obrigatório.").max(100),
  agentId: z.string().uuid("Selecione um agente válido."),
  modelId: z.string().uuid("Selecione um modelo válido.").nullable(),
  enabled: z.boolean().optional(),
});

export const updateSupportSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  agentId: z.string().uuid().optional(),
  modelId: z.string().uuid().nullable().optional(),
  enabled: z.boolean().optional(),
});
