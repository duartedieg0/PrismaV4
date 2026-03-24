import { z } from "zod";

export const createModelSchema = z.object({
  name: z.string().min(1, "O nome do modelo é obrigatório.").max(100),
  provider: z.string().min(1, "O provider é obrigatório.").max(50).default("openai"),
  baseUrl: z.string().url("Informe uma URL válida."),
  apiKey: z.string().min(1, "A chave secreta é obrigatória."),
  modelId: z.string().min(1, "O model ID é obrigatório.").max(100),
  enabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  systemRole: z.string().max(50).nullable().optional(),
});

export const updateModelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  provider: z.string().min(1).max(50).optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  modelId: z.string().min(1).max(100).optional(),
  enabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  systemRole: z.string().max(50).nullable().optional(),
});

export type CreateModelInput = z.infer<typeof createModelSchema>;
export type UpdateModelInput = z.infer<typeof updateModelSchema>;
