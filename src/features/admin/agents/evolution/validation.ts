import { z } from "zod";

export const evolveAgentSchema = z.object({
  feedbackIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um feedback."),
});

export const resolveEvolutionSchema = z.object({
  evolutionId: z.string().uuid("Evolution ID inválido."),
  accepted: z.boolean(),
  suggestedPrompt: z.string().min(1).max(50000).optional(),
});
