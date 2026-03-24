import { z } from "zod";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import {
  createRuntimeExecutionMetadata,
  createRuntimeFailure,
} from "@/mastra/contracts/runtime-contracts";
import { normalizeExtractionPayload } from "@/features/exams/extraction/normalization";
import { createRuntimeEventRecord } from "@/mastra/observability/runtime-events";
import {
  buildExtractionPrompt,
  EXTRACTION_PROMPT_VERSION,
} from "@/mastra/prompts/extraction-prompt";
import type { AiModelRecord } from "@/mastra/providers/model-registry";
import { resolveExtractionModel, toMastraModelId } from "@/mastra/providers/model-registry";
import { createPersistExtractionTool } from "@/mastra/tools/persist-extraction-tool";
import { createRegisterRuntimeEventTool } from "@/mastra/tools/register-runtime-event-tool";

const extractionWorkflowInputSchema = z.object({
  examId: z.string(),
  initiatedBy: z.string(),
  pdfPath: z.string(),
  correlationId: z.string().optional(),
});

const extractionPayloadSchema = z.object({
  metadata: z.object({
    traceId: z.string(),
    correlationId: z.string(),
    examId: z.string(),
    stage: z.enum(["extraction"]),
    model: z.string(),
    agentId: z.string(),
    promptVersion: z.string(),
    startedAt: z.string(),
  }),
  payload: z.object({
    questions: z.array(
      z.object({
        orderNum: z.number(),
        content: z.string(),
        questionType: z.enum(["objective", "essay"]),
        alternatives: z.array(z.object({ label: z.string(), text: z.string() })).nullable(),
        visualElements: z.array(z.object({ type: z.string(), description: z.string() })).nullable(),
        extractionWarning: z.string().nullable(),
      }),
    ),
  }),
});

const extractionWorkflowOutputSchema = z.object({
  outcome: z.enum(["success", "error"]),
  metadata: z.object({
    traceId: z.string(),
    correlationId: z.string(),
    examId: z.string(),
    stage: z.enum(["extraction"]),
    model: z.string(),
    agentId: z.string(),
    promptVersion: z.string(),
    startedAt: z.string(),
  }),
  status: z.enum(["awaiting_answers", "error"]),
  warnings: z.array(z.string()).optional(),
  questionsCount: z.number().optional(),
  failure: z
    .object({
      stage: z.enum(["extraction", "bncc_analysis", "bloom_analysis", "adaptation"]),
      code: z.string(),
      message: z.string(),
      retryable: z.boolean(),
    })
    .optional(),
});

type ExtractionWorkflowDependencies = {
  listModels(): Promise<AiModelRecord[]>;
  runExtractionAgent(input: {
    prompt: string;
    pdfPath: string;
    model: AiModelRecord;
  }): Promise<{
    questions: Array<{
      orderNum: number;
      content: string;
      questionType: "objective" | "essay";
      alternatives: Array<{ label: string; text: string }> | null;
      visualElements: Array<{ type: string; description: string }> | null;
      extractionWarning: string | null;
    }>;
  }>;
  persistExtraction(input: {
    examId: string;
    status: "awaiting_answers" | "error";
    errorMessage: string | null;
    questions: Array<{
      orderNum: number;
      content: string;
      questionType: "objective" | "essay";
      alternatives: Array<{ label: string; text: string }> | null;
      visualElements: Array<{ type: string; description: string }> | null;
      extractionWarning: string | null;
    }>;
  }): Promise<{
    warnings: string[];
    questionsCount: number;
  }>;
  registerEvent?(event: ReturnType<typeof createRuntimeEventRecord>): Promise<void> | void;
};

export function createExtractExamWorkflow(
  dependencies: ExtractionWorkflowDependencies,
) {
  const registerRuntimeEventTool = createRegisterRuntimeEventTool(async (input) => {
    await dependencies.registerEvent?.(
      {
        category: "workflow",
        event: input.event as ReturnType<typeof createRuntimeEventRecord>["event"],
        status: input.status,
        traceId: input.traceId,
        correlationId: input.correlationId,
        examId: input.examId,
        questionId: input.questionId,
        supportId: input.supportId,
        stage: input.stage,
        model: input.model,
        agentId: input.agentId,
        promptVersion: input.promptVersion,
        failureCode: input.failureCode,
        failureMessage: input.failureMessage,
      },
    );
  });

  const persistExtractionTool = createPersistExtractionTool(async (input) =>
    dependencies.persistExtraction(input),
  );

  const startStep = createStep({
    id: "prepare-extraction",
    inputSchema: extractionWorkflowInputSchema,
    outputSchema: extractionPayloadSchema,
    execute: async ({ inputData }) => {
      const models = await dependencies.listModels();
      const modelRecord = resolveExtractionModel({
        models,
      });
      const baseMetadata = createRuntimeExecutionMetadata({
        correlationId: inputData.correlationId,
        examId: inputData.examId,
        stage: "extraction",
        model: toMastraModelId(modelRecord),
        agentId: "extraction-agent",
        promptVersion: EXTRACTION_PROMPT_VERSION,
      });
      const metadata = {
        ...baseMetadata,
        stage: "extraction" as const,
      };

      await registerRuntimeEventTool.execute?.({
        ...createRuntimeEventRecord(metadata, "started"),
      }, {});

      const payload = await dependencies.runExtractionAgent({
        prompt: buildExtractionPrompt(),
        pdfPath: inputData.pdfPath,
        model: modelRecord,
      });

      return {
        metadata,
        payload,
      };
    },
  });

  const persistStep = createStep({
    id: "persist-extraction-result",
    inputSchema: extractionPayloadSchema.extend({
      payload: extractionPayloadSchema.shape.payload,
    }),
    outputSchema: extractionWorkflowOutputSchema,
    execute: async ({ inputData }) => {
      const result = normalizeExtractionPayload(inputData.payload);

      if (result.outcome === "error") {
        const failure = createRuntimeFailure({
          stage: "extraction",
          code: "NO_VALID_QUESTIONS",
          message:
            result.fatalErrorMessage ??
            "Nenhuma questão válida foi encontrada no PDF.",
          retryable: false,
        });

        await persistExtractionTool.execute?.({
          examId: inputData.metadata.examId,
          status: "error",
          errorMessage:
            result.fatalErrorMessage ??
            "Nenhuma questão válida foi encontrada no PDF.",
          questions: [],
        }, {});

        await registerRuntimeEventTool.execute?.({
          ...createRuntimeEventRecord(inputData.metadata, "failed", failure),
        }, {});

        return {
          outcome: "error" as const,
          metadata: inputData.metadata,
          failure,
          status: "error" as const,
        };
      }

      const persisted = await persistExtractionTool.execute?.({
        examId: inputData.metadata.examId,
        status: "awaiting_answers",
        errorMessage: null,
        questions: result.questions,
      }, {});

      await registerRuntimeEventTool.execute?.({
        ...createRuntimeEventRecord(inputData.metadata, "completed"),
      }, {});

      if (!persisted || !("warnings" in persisted) || !("questionsCount" in persisted)) {
        throw new Error("Falha ao persistir a extração.");
      }

      return {
        outcome: "success" as const,
        metadata: inputData.metadata,
        status: "awaiting_answers" as const,
        warnings: persisted.warnings,
        questionsCount: persisted.questionsCount,
      };
    },
  });

  return createWorkflow({
    id: "extract-exam-workflow",
    inputSchema: extractionWorkflowInputSchema,
    outputSchema: extractionWorkflowOutputSchema,
  })
    .then(startStep)
    .then(persistStep)
    .commit();
}

export async function runExtractExamWorkflow(
  workflow: ReturnType<typeof createExtractExamWorkflow>,
  inputData: z.infer<typeof extractionWorkflowInputSchema>,
) {
  const run = await workflow.createRun();
  return run.start({
    inputData,
  });
}
