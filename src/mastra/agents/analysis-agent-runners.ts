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

const objectiveAdaptationSchema = z.object({
  adaptedStatement: z.string().min(1),
  adaptedAlternatives: z.array(z.string().min(1)).min(1),
});

const essayAdaptationSchema = z.object({
  adaptedContent: z.string().min(1),
});

function mapAdaptedAlternatives(
  alternatives: QuestionAlternative[],
  adaptedAlternatives: string[],
  correctAnswer: string | null,
): AdaptedAlternative[] {
  if (adaptedAlternatives.length !== alternatives.length) {
    throw new Error("O agente retornou uma quantidade inválida de alternativas adaptadas.");
  }

  return alternatives.map((alternative, index) => ({
    id: `alt-${index}`,
    label: alternative.label,
    originalText: alternative.text,
    adaptedText: adaptedAlternatives[index]?.trim() || alternative.text,
    isCorrect: correctAnswer === alternative.label,
    position: index,
  }));
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
  };
}
