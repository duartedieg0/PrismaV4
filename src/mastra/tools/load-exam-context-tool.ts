import { z } from "zod";
import { createTool } from "@mastra/core/tools";

const alternativeSchema = z.object({
  label: z.string(),
  text: z.string(),
});

const questionContextSchema = z.object({
  id: z.string(),
  orderNum: z.number(),
  content: z.string(),
  questionType: z.enum(["objective", "essay"]),
  alternatives: z.array(alternativeSchema).nullable(),
  correctAnswer: z.string().nullable(),
});

const supportContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  agentId: z.string(),
  agentVersion: z.number(),
  modelId: z.string(),
  prompt: z.string(),
  model: z.object({
    id: z.string(),
    name: z.string(),
    provider: z.string(),
    modelId: z.string(),
    baseUrl: z.string(),
    apiKey: z.string(),
    enabled: z.boolean(),
    isDefault: z.boolean(),
  }),
});

const loadExamContextInputSchema = z.object({
  examId: z.string(),
});

const loadExamContextOutputSchema = z.object({
  exam: z.object({
    id: z.string(),
    subjectName: z.string(),
    gradeLevelName: z.string(),
    topicName: z.string(),
  }),
  questions: z.array(questionContextSchema),
  supports: z.array(supportContextSchema),
});

export type LoadExamContextToolInput = z.infer<typeof loadExamContextInputSchema>;
export type LoadExamContextToolOutput = z.infer<typeof loadExamContextOutputSchema>;

export function createLoadExamContextTool(
  onLoad: (
    input: LoadExamContextToolInput,
  ) => Promise<LoadExamContextToolOutput>,
) {
  return createTool({
    id: "load-exam-context",
    description: "Carrega o contexto necessário para análise e adaptação de um exame.",
    inputSchema: loadExamContextInputSchema,
    outputSchema: loadExamContextOutputSchema,
    execute: onLoad,
  });
}
