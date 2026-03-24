import { z } from "zod";
import { createExtractionAgent } from "@/mastra/agents/extraction-agent";
import { createMastraModel } from "@/mastra/providers/provider-factory";
import type { AiModelRecord } from "@/mastra/providers/model-registry";

const extractedQuestionSchema = z.object({
  orderNum: z.number(),
  content: z.string().min(1),
  questionType: z.enum(["objective", "essay"]),
  alternatives: z.array(z.object({ label: z.string(), text: z.string() })).nullable(),
  visualElements: z.array(z.object({ type: z.string(), description: z.string() })).nullable(),
  extractionWarning: z.string().nullable(),
});

const extractionOutputSchema = z.object({
  questions: z.array(extractedQuestionSchema),
});

export async function runPdfExtractionAgent(input: {
  prompt: string;
  model: AiModelRecord;
  pdfData: Uint8Array;
  contentType: string;
}) {
  const agent = createExtractionAgent(createMastraModel(input.model));
  const response = await agent.generate(
    [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: input.prompt,
          },
          {
            type: "file",
            data: input.pdfData,
            mediaType: input.contentType,
          },
        ],
      },
    ],
    {
      structuredOutput: {
        schema: extractionOutputSchema,
      },
    },
  );

  return extractionOutputSchema.parse(response.object);
}
