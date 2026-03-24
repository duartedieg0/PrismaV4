import { z } from "zod";

export const updateAdminUserSchema = z
  .object({
    blocked: z.boolean().optional(),
    role: z.enum(["teacher", "admin"]).optional(),
  })
  .refine((input) => input.blocked !== undefined || input.role !== undefined, {
    message: "Informe ao menos uma alteração de governança.",
    path: ["blocked"],
  });

export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
