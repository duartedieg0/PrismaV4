import { z } from "zod";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { createRuntimeExecutionMetadata, createRuntimeFailure } from "@/mastra/contracts/runtime-contracts";
import { createRuntimeEventRecord } from "@/mastra/observability/runtime-events";
import { buildAdaptationPrompt, ADAPTATION_PROMPT_VERSION } from "@/mastra/prompts/adaptation-prompt";
import { buildBloomPrompt, BLOOM_PROMPT_VERSION } from "@/mastra/prompts/bloom-prompt";
import { buildBnccPrompt, BNCC_PROMPT_VERSION } from "@/mastra/prompts/bncc-prompt";
import { createLoadExamContextTool, type LoadExamContextToolOutput } from "@/mastra/tools/load-exam-context-tool";
import { createPersistAdaptationsTool } from "@/mastra/tools/persist-adaptations-tool";
import { createRegisterRuntimeEventTool } from "@/mastra/tools/register-runtime-event-tool";
import type { AdaptedAlternative } from "@/domains/adaptations/contracts";
import type { AiModelRecord } from "@/mastra/providers/model-registry";

const analyzeAndAdaptInputSchema = z.object({
  examId: z.string(),
  initiatedBy: z.string().optional(),
  correlationId: z.string().optional(),
});

const analyzeAndAdaptOutputSchema = z.object({
  outcome: z.enum(["success", "error"]),
  metadata: z.object({
    traceId: z.string(),
    correlationId: z.string(),
    examId: z.string(),
    stage: z.enum(["adaptation"]),
    model: z.string(),
    agentId: z.string(),
    promptVersion: z.string(),
    startedAt: z.string(),
  }),
  status: z.enum(["completed", "error"]),
  processedQuestions: z.number().optional(),
  processedAdaptations: z.number().optional(),
  failure: z
    .object({
      stage: z.enum(["extraction", "bncc_analysis", "bloom_analysis", "adaptation"]),
      code: z.string(),
      message: z.string(),
      retryable: z.boolean(),
    })
    .optional(),
});

type AnalysisResult = {
  skills: string[];
  analysis: string;
};

type BloomResult = {
  level: string;
  analysis: string;
};

type AdaptationAgentResult = {
  adaptedContent: string;
  adaptedAlternatives: AdaptedAlternative[] | null;
};

type AnalyzeAndAdaptDependencies = {
  loadExamContext(input: { examId: string }): Promise<LoadExamContextToolOutput>;
  createPendingAdaptations(input: {
    questionIds: string[];
    supportIds: string[];
  }): Promise<void>;
  persistAdaptation(input: {
    examId: string;
    questionId: string;
    supportId: string;
    status: "pending" | "processing" | "completed" | "error";
    agentVersion?: number | null;
    promptVersion?: string | null;
    bnccSkills?: string[] | null;
    bloomLevel?: string | null;
    bnccAnalysis?: string | null;
    bloomAnalysis?: string | null;
    adaptedContent?: string | null;
    adaptedAlternatives?: AdaptedAlternative[] | null;
  }): Promise<void>;
  updateExamStatus(input: {
    examId: string;
    status: "completed" | "error";
    errorMessage?: string | null;
  }): Promise<void>;
  runBnccAnalysis(input: {
    prompt: string;
    model: AiModelRecord;
  }): Promise<AnalysisResult>;
  runBloomAnalysis(input: {
    prompt: string;
    model: AiModelRecord;
  }): Promise<BloomResult>;
  runAdaptation(input: {
    prompt: string;
    instructions: string;
    model: AiModelRecord;
    alternatives: Array<{ label: string; text: string }> | null;
    correctAnswer: string | null;
  }): Promise<AdaptationAgentResult>;
  registerEvent?(event: ReturnType<typeof createRuntimeEventRecord>): Promise<void> | void;
};

function formatAlternatives(
  alternatives: Array<{ label: string; text: string }> | null,
): string {
  if (!alternatives || alternatives.length === 0) {
    return "";
  }

  return `Alternativas:\n${alternatives
    .map((alternative) => `${alternative.label}) ${alternative.text}`)
    .join("\n")}`;
}

export function parseAdaptationPayload(
  text: string,
  alternatives: Array<{ label: string; text: string }> | null,
  correctAnswer: string | null,
): AdaptationAgentResult {
  if (!alternatives || alternatives.length === 0) {
    return {
      adaptedContent: text.trim(),
      adaptedAlternatives: null,
    };
  }

  let parsed: {
    adaptedStatement?: string;
    adaptedAlternatives?: Array<{ originalLabel: string; text: string }>;
  } | null = null;

  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    const jsonMatch =
      text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ??
      text.match(/(\{[\s\S]*\})/);

    if (jsonMatch?.[1]) {
      parsed = JSON.parse(jsonMatch[1]) as typeof parsed;
    }
  }

  const originalsByLabel = new Map(
    alternatives.map((alt) => [alt.label, alt]),
  );

  const adaptedAlternatives = parsed?.adaptedAlternatives?.map((adapted, index) => ({
    id: `alt-${index}`,
    label: adapted.originalLabel,
    originalText: originalsByLabel.get(adapted.originalLabel)?.text ?? "",
    adaptedText: adapted.text?.trim() || "",
    isCorrect: correctAnswer === adapted.originalLabel,
    position: index,
  })) ?? null;

  return {
    adaptedContent: parsed?.adaptedStatement ?? text.trim(),
    adaptedAlternatives,
  };
}

export function createAnalyzeAndAdaptWorkflow(
  dependencies: AnalyzeAndAdaptDependencies,
) {
  const loadExamContextTool = createLoadExamContextTool(async (input) =>
    dependencies.loadExamContext(input),
  );
  const persistAdaptationsTool = createPersistAdaptationsTool(async (input) => {
    await dependencies.persistAdaptation(input);
    return { recorded: true as const };
  });
  const registerRuntimeEventTool = createRegisterRuntimeEventTool(async (input) => {
    await dependencies.registerEvent?.({
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
    });
  });

  const loadContextStep = createStep({
    id: "load-adaptation-context",
    inputSchema: analyzeAndAdaptInputSchema,
    outputSchema: z.object({
      metadata: analyzeAndAdaptOutputSchema.shape.metadata,
      context: z.object({
        exam: z.object({
          id: z.string(),
          subjectName: z.string(),
          gradeLevelName: z.string(),
          topicName: z.string(),
        }),
        questions: z.array(
          z.object({
            id: z.string(),
            orderNum: z.number(),
            content: z.string(),
            questionType: z.enum(["objective", "essay"]),
            alternatives: z.array(z.object({ label: z.string(), text: z.string() })).nullable(),
            correctAnswer: z.string().nullable(),
          }),
        ),
        supports: z.array(
          z.object({
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
          }),
        ),
      }),
    }),
    execute: async ({ inputData }) => {
      const context = await loadExamContextTool.execute?.(
        { examId: inputData.examId },
        {},
      );

      if (!context || "error" in context) {
        throw new Error("Falha ao carregar o contexto do exame para adaptação.");
      }

      const baseMetadata = createRuntimeExecutionMetadata({
        correlationId: inputData.correlationId,
        examId: inputData.examId,
        stage: "adaptation",
        model: `${context.supports[0]?.model.provider ?? "openai"}/${context.supports[0]?.model.modelId ?? "unknown"}`,
        agentId: "adaptation-agent",
        promptVersion: ADAPTATION_PROMPT_VERSION,
      });
      const metadata = {
        ...baseMetadata,
        stage: "adaptation" as const,
      };

      await registerRuntimeEventTool.execute?.(
        {
          ...createRuntimeEventRecord(metadata, "started"),
        },
        {},
      );

      await dependencies.createPendingAdaptations({
        questionIds: context.questions.map((question) => question.id),
        supportIds: context.supports.map((support) => support.id),
      });

      return {
        metadata,
        context,
      };
    },
  });

  const executeStep = createStep({
    id: "execute-adaptation",
    inputSchema: loadContextStep.outputSchema,
    outputSchema: analyzeAndAdaptOutputSchema,
    execute: async ({ inputData }) => {
      let processedQuestions = 0;
      let processedAdaptations = 0;

      try {
        for (const question of inputData.context.questions) {
          const sharedModelRecord: AiModelRecord = inputData.context.supports[0].model;
          const alternativesText = formatAlternatives(question.alternatives);
          const bncc = await dependencies.runBnccAnalysis({
            prompt: buildBnccPrompt({
              subject: inputData.context.exam.subjectName,
              gradeLevel: inputData.context.exam.gradeLevelName,
              topic: inputData.context.exam.topicName,
              questionContent: question.content,
              alternativesText,
            }),
            model: sharedModelRecord,
          });
          const bloom = await dependencies.runBloomAnalysis({
            prompt: buildBloomPrompt({
              questionContent: question.content,
              alternativesText,
            }),
            model: sharedModelRecord,
          });

          for (const support of inputData.context.supports) {
            await persistAdaptationsTool.execute?.(
                {
                  examId: inputData.context.exam.id,
                  questionId: question.id,
                  supportId: support.id,
                  status: "processing",
              },
              {},
              );

            try {
              const adaptation = await dependencies.runAdaptation({
                prompt: buildAdaptationPrompt({
                  agentPrompt: support.prompt,
                  subjectName: inputData.context.exam.subjectName,
                  gradeLevelName: inputData.context.exam.gradeLevelName,
                  topicName: inputData.context.exam.topicName,
                  correctAnswer: question.correctAnswer,
                  questionContent: question.content,
                  alternatives: question.alternatives,
                  supportName: support.name,
                }),
                instructions: support.prompt,
                model: support.model,
                alternatives: question.alternatives,
                correctAnswer: question.correctAnswer,
              });

              await persistAdaptationsTool.execute?.(
                {
                  examId: inputData.context.exam.id,
                  questionId: question.id,
                  supportId: support.id,
                  status: "completed",
                  agentVersion: support.agentVersion,
                  promptVersion: `${ADAPTATION_PROMPT_VERSION}/agent-v${support.agentVersion}`,
                  bnccSkills: bncc.skills,
                  bloomLevel: bloom.level,
                  bnccAnalysis: bncc.analysis,
                  bloomAnalysis: bloom.analysis,
                  adaptedContent: adaptation.adaptedContent,
                  adaptedAlternatives:
                    adaptation.adaptedAlternatives?.map((alternative) => ({
                      ...alternative,
                      label: alternative.label ?? "",
                    })) ?? null,
                },
                {},
              );
            } catch {
              await persistAdaptationsTool.execute?.(
                {
                  examId: inputData.context.exam.id,
                  questionId: question.id,
                  supportId: support.id,
                  status: "error",
                  agentVersion: support.agentVersion,
                  promptVersion: `${ADAPTATION_PROMPT_VERSION}/agent-v${support.agentVersion}`,
                  bnccSkills: bncc.skills,
                  bloomLevel: bloom.level,
                  bnccAnalysis: bncc.analysis,
                  bloomAnalysis: bloom.analysis,
                },
                {},
              );
            }

            processedAdaptations += 1;
          }

          processedQuestions += 1;
        }

        await dependencies.updateExamStatus({
          examId: inputData.context.exam.id,
          status: "completed",
          errorMessage: null,
        });

        await registerRuntimeEventTool.execute?.(
          {
            ...createRuntimeEventRecord(inputData.metadata, "completed"),
          },
          {},
        );

        return {
          outcome: "success" as const,
          metadata: inputData.metadata,
          status: "completed" as const,
          processedQuestions,
          processedAdaptations,
        };
      } catch {
        const failure = createRuntimeFailure({
          stage: "adaptation",
          code: "ADAPTATION_WORKFLOW_FAILED",
          message: "Erro ao executar o workflow de adaptação.",
          retryable: false,
        });

        await dependencies.updateExamStatus({
          examId: inputData.context.exam.id,
          status: "error",
          errorMessage: failure.message,
        });
        await registerRuntimeEventTool.execute?.(
          {
            ...createRuntimeEventRecord(inputData.metadata, "failed", failure),
          },
          {},
        );

        return {
          outcome: "error" as const,
          metadata: inputData.metadata,
          status: "error" as const,
          failure,
        };
      }
    },
  });

  return createWorkflow({
    id: "analyze-and-adapt-workflow",
    inputSchema: analyzeAndAdaptInputSchema,
    outputSchema: analyzeAndAdaptOutputSchema,
  })
    .then(loadContextStep)
    .then(executeStep)
    .commit();
}

export async function runAnalyzeAndAdaptWorkflow(
  workflow: ReturnType<typeof createAnalyzeAndAdaptWorkflow>,
  inputData: z.infer<typeof analyzeAndAdaptInputSchema>,
) {
  const run = await workflow.createRun();
  return run.start({
    inputData,
  });
}
