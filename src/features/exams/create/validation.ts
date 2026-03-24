import { z } from "zod";

export const CREATE_EXAM_MAX_PDF_SIZE = 25 * 1024 * 1024;
export const CREATE_EXAM_MAX_TOPIC_LENGTH = 500;

const uploadedPdfSchema = z.object({
  fileName: z.string().min(1, "Selecione um arquivo PDF."),
  fileType: z.string().refine((value) => value === "application/pdf", {
    message: "O arquivo deve ser um PDF.",
  }),
  fileSize: z
    .number()
    .max(CREATE_EXAM_MAX_PDF_SIZE, "O arquivo deve ter no maximo 25 MB."),
});

export const createExamInputSchema = z.object({
  subjectId: z.string().uuid("Selecione uma disciplina valida."),
  gradeLevelId: z.string().uuid("Selecione um ano/série valido."),
  topic: z
    .string()
    .max(CREATE_EXAM_MAX_TOPIC_LENGTH, "O tema deve ter no maximo 500 caracteres.")
    .optional(),
  supportSelections: z
    .array(
      z.object({
        supportId: z.string().uuid(),
      }),
    )
    .min(1, "Selecione ao menos um apoio."),
  uploadedPdf: uploadedPdfSchema,
});

export function validatePdfFile(file: {
  name?: string;
  type: string;
  size: number;
} | null) {
  if (!file) {
    return "Selecione um arquivo PDF.";
  }

  if (file.type !== "application/pdf") {
    return "O arquivo deve ser um PDF.";
  }

  if (file.size > CREATE_EXAM_MAX_PDF_SIZE) {
    return "O arquivo deve ter no maximo 25 MB.";
  }

  return null;
}
