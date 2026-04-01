import { z } from "zod";
import { createTool } from "@mastra/core/tools";

const persistedAlternativeSchema = z.object({
  id: z.string(),
  label: z.string(),
  originalText: z.string(),
  adaptedText: z.string(),
  isCorrect: z.boolean(),
  position: z.number(),
});

const persistAdaptationInputSchema = z.object({
  examId: z.string(),
  questionId: z.string(),
  supportId: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  errorMessage: z.string().nullable().optional(),
  agentVersion: z.number().nullable().optional(),
  promptVersion: z.string().nullable().optional(),
  bnccSkills: z.array(z.string()).nullable().optional(),
  bloomLevel: z.string().nullable().optional(),
  bnccAnalysis: z.string().nullable().optional(),
  bloomAnalysis: z.string().nullable().optional(),
  adaptedContent: z.string().nullable().optional(),
  adaptedAlternatives: z.array(persistedAlternativeSchema).nullable().optional(),
});

export type PersistAdaptationToolInput = z.infer<typeof persistAdaptationInputSchema>;

export function createPersistAdaptationsTool(
  onPersist: (input: PersistAdaptationToolInput) => Promise<{
    recorded: true;
  }>,
) {
  return createTool({
    id: "persist-adaptations",
    description: "Persiste o estado e o resultado de uma adaptação por questão e apoio.",
    inputSchema: persistAdaptationInputSchema,
    outputSchema: z.object({
      recorded: z.literal(true),
    }),
    execute: onPersist,
  });
}
