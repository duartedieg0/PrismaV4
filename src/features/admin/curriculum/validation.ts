import { z } from "zod";

export const createEnabledNameEntitySchema = z.object({
  name: z.string().min(1, "O nome é obrigatório.").max(100),
});

export const updateEnabledEntitySchema = z.object({
  enabled: z.boolean(),
});
