import { z } from "zod";
import { BRAZILIAN_STATES } from "./contracts";

export const profileFormSchema = z.object({
  full_name: z.string().max(100, "Nome deve ter no maximo 100 caracteres").optional().default(""),
  phone: z.string().max(20, "Telefone deve ter no maximo 20 caracteres").optional().default(""),
  bio: z.string().max(500, "Bio deve ter no maximo 500 caracteres").optional().default(""),
  state: z
    .string()
    .refine((val) => val === "" || (BRAZILIAN_STATES as readonly string[]).includes(val), {
      message: "Estado invalido",
    })
    .optional()
    .default(""),
  city: z.string().max(100, "Cidade deve ter no maximo 100 caracteres").optional().default(""),
  schools: z.string().max(500, "Escolas deve ter no maximo 500 caracteres").optional().default(""),
  years_experience: z
    .number()
    .int()
    .min(0, "Anos de experiencia deve ser >= 0")
    .nullable()
    .optional()
    .default(null),
  academic_background: z
    .string()
    .max(200, "Formacao deve ter no maximo 200 caracteres")
    .optional()
    .default(""),
  subject_ids: z.array(z.string().uuid()).optional().default([]),
  grade_level_ids: z.array(z.string().uuid()).optional().default([]),
});

export type ProfileFormInput = z.infer<typeof profileFormSchema>;
