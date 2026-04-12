import { z } from "zod";
import type { AdaptedAlternative } from "@/domains/adaptations/contracts";
import type { QuestionAlternative } from "@/domains/exams/contracts";
import { createAdaptationAgent } from "@/mastra/agents/adaptation-agent";
import { createBloomAnalysisAgent } from "@/mastra/agents/bloom-analysis-agent";
import { createBnccAnalysisAgent } from "@/mastra/agents/bncc-analysis-agent";
import { createMastraModel } from "@/mastra/providers/provider-factory";
import type { AiModelRecord } from "@/mastra/providers/model-registry";

const bnccAnalysisSchema = z.object({
  skills: z.array(z.string().min(1)).min(1),
  analysis: z.string().min(1),
});

const bloomAnalysisSchema = z.object({
  level: z.enum([
    "Lembrar",
    "Entender",
    "Aplicar",
    "Analisar",
    "Avaliar",
    "Criar",
  ]),
  analysis: z.string().min(1),
});

const adaptedAlternativeItemSchema = z.object({
  originalLabel: z.string().min(1),
  text: z.string().min(1),
});

const objectiveAdaptationSchema = z.object({
  adaptedStatement: z.string().min(1),
  adaptedAlternatives: z.array(adaptedAlternativeItemSchema).min(1),
});

const essayAdaptationSchema = z.object({
  adaptedContent: z.string().min(1),
});

function normalizeLabel(label: string): string {
  return label.trim().replace(/\)$/, "").toUpperCase();
}

function mapAdaptedAlternatives(
  alternatives: QuestionAlternative[],
  adaptedAlternatives: Array<{ originalLabel: string; text: string }>,
  correctAnswer: string | null,
): AdaptedAlternative[] {
  const originalsByLabel = new Map(
    alternatives.map((alt) => [normalizeLabel(alt.label), alt]),
  );

  const normalizedCorrectAnswer = correctAnswer
    ? normalizeLabel(correctAnswer)
    : null;

  const mapped = adaptedAlternatives.map((adapted, index) => {
    const normalizedAdaptedLabel = normalizeLabel(adapted.originalLabel);
    const original = originalsByLabel.get(normalizedAdaptedLabel);
    if (!original) {
      throw new Error(
        `O agente retornou a alternativa "${adapted.originalLabel}" que não existe na questão original.`,
      );
    }
    return {
      id: `alt-${index}`,
      label: original.label,
      originalText: original.text,
      adaptedText: adapted.text.trim(),
      isCorrect: normalizedCorrectAnswer === normalizedAdaptedLabel,
      position: index,
    };
  });

  if (
    normalizedCorrectAnswer &&
    !mapped.some((alt) => alt.isCorrect)
  ) {
    throw new Error(
      `A alternativa correta (${correctAnswer}) foi removida pelo agente de adaptação.`,
    );
  }

  return mapped;
}

export async function runBnccAnalysisAgent(input: {
  prompt: string;
  model: AiModelRecord;
}) {
  const agent = createBnccAnalysisAgent(createMastraModel(input.model));
  const response = await agent.generate(input.prompt, {
    structuredOutput: {
      schema: bnccAnalysisSchema,
    },
  });
  const result = bnccAnalysisSchema.parse(response.object);

  return {
    skills: result.skills.map((skill) => skill.trim()).filter(Boolean),
    analysis: result.analysis.trim(),
    usage: {
      inputTokens: response.usage?.inputTokens ?? 0,
      outputTokens: response.usage?.outputTokens ?? 0,
    },
  };
}

export async function runBloomAnalysisAgent(input: {
  prompt: string;
  model: AiModelRecord;
}) {
  const agent = createBloomAnalysisAgent(createMastraModel(input.model));
  const response = await agent.generate(input.prompt, {
    structuredOutput: {
      schema: bloomAnalysisSchema,
    },
  });
  const result = bloomAnalysisSchema.parse(response.object);

  return {
    level: result.level,
    analysis: result.analysis.trim(),
    usage: {
      inputTokens: response.usage?.inputTokens ?? 0,
      outputTokens: response.usage?.outputTokens ?? 0,
    },
  };
}

export async function runAdaptationAgent(input: {
  prompt: string;
  instructions: string;
  model: AiModelRecord;
  alternatives: QuestionAlternative[] | null;
  correctAnswer: string | null;
}) {
  const agent = createAdaptationAgent(
    createMastraModel(input.model),
    input.instructions,
  );

  if (!input.alternatives || input.alternatives.length === 0) {
    const response = await agent.generate(input.prompt, {
      structuredOutput: {
        schema: essayAdaptationSchema,
      },
    });
    const result = essayAdaptationSchema.parse(response.object);

    return {
      adaptedContent: result.adaptedContent.trim(),
      adaptedAlternatives: null,
      usage: {
        inputTokens: response.usage?.inputTokens ?? 0,
        outputTokens: response.usage?.outputTokens ?? 0,
      },
    };
  }

  const response = await agent.generate(input.prompt, {
    structuredOutput: {
      schema: objectiveAdaptationSchema,
    },
  });
  const result = objectiveAdaptationSchema.parse(response.object);

  return {
    adaptedContent: result.adaptedStatement.trim(),
    adaptedAlternatives: mapAdaptedAlternatives(
      input.alternatives,
      result.adaptedAlternatives,
      input.correctAnswer,
    ),
    usage: {
      inputTokens: response.usage?.inputTokens ?? 0,
      outputTokens: response.usage?.outputTokens ?? 0,
    },
  };
}
