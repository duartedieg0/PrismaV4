import { z } from "zod";
import { createTool } from "@mastra/core/tools";

const questionAlternativeSchema = z.object({
  label: z.string(),
  text: z.string(),
});

const questionVisualElementSchema = z.object({
  type: z.string(),
  description: z.string(),
});

const persistExtractionInputSchema = z.object({
  examId: z.string(),
  status: z.enum(["awaiting_answers", "error"]),
  errorMessage: z.string().nullable(),
  questions: z.array(
    z.object({
      orderNum: z.number(),
      content: z.string(),
      questionType: z.enum(["objective", "essay"]),
      alternatives: z.array(questionAlternativeSchema).nullable(),
      visualElements: z.array(questionVisualElementSchema).nullable(),
      extractionWarning: z.string().nullable(),
    }),
  ),
});

export type PersistExtractionToolInput = z.infer<typeof persistExtractionInputSchema>;

export function createPersistExtractionTool(
  onPersist: (input: PersistExtractionToolInput) => Promise<{
    warnings: string[];
    questionsCount: number;
  }>,
) {
  return createTool({
    id: "persist-extraction",
    description: "Persiste as questões extraídas e atualiza o status do exame.",
    inputSchema: persistExtractionInputSchema,
    outputSchema: z.object({
      warnings: z.array(z.string()),
      questionsCount: z.number(),
    }),
    execute: onPersist,
  });
}
