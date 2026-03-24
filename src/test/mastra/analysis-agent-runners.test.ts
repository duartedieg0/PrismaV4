import { describe, expect, it, vi } from "vitest";

const bnccGenerate = vi.fn();
const bloomGenerate = vi.fn();
const adaptationGenerate = vi.fn();

vi.mock("@/mastra/agents/bncc-analysis-agent", () => ({
  createBnccAnalysisAgent: vi.fn(() => ({
    generate: bnccGenerate,
  })),
}));

vi.mock("@/mastra/agents/bloom-analysis-agent", () => ({
  createBloomAnalysisAgent: vi.fn(() => ({
    generate: bloomGenerate,
  })),
}));

vi.mock("@/mastra/agents/adaptation-agent", () => ({
  createAdaptationAgent: vi.fn(() => ({
    generate: adaptationGenerate,
  })),
}));

describe("analysis agent runners", () => {
  it("returns BNCC structured output from the analysis agent", async () => {
    const { runBnccAnalysisAgent } = await import("@/mastra/agents/analysis-agent-runners");

    bnccGenerate.mockResolvedValueOnce({
      object: {
        skills: [" EF07MA01 ", "EF07MA02"],
        analysis: "A questão trabalha equivalência de frações.",
      },
    });

    const result = await runBnccAnalysisAgent({
      prompt: "Analise a BNCC desta questão.",
      model: {} as never,
    });

    expect(result).toEqual({
      skills: ["EF07MA01", "EF07MA02"],
      analysis: "A questão trabalha equivalência de frações.",
    });
  });

  it("returns Bloom structured output from the analysis agent", async () => {
    const { runBloomAnalysisAgent } = await import("@/mastra/agents/analysis-agent-runners");

    bloomGenerate.mockResolvedValueOnce({
      object: {
        level: "Aplicar",
        analysis: "O estudante aplica o conceito para resolver o problema.",
      },
    });

    const result = await runBloomAnalysisAgent({
      prompt: "Analise Bloom.",
      model: {} as never,
    });

    expect(result).toEqual({
      level: "Aplicar",
      analysis: "O estudante aplica o conceito para resolver o problema.",
    });
  });

  it("maps objective adaptations into the domain shape", async () => {
    const { runAdaptationAgent } = await import("@/mastra/agents/analysis-agent-runners");

    adaptationGenerate.mockResolvedValueOnce({
      object: {
        adaptedStatement: "Quanto é metade mais um quarto?",
        adaptedAlternatives: [
          { originalLabel: "A", text: "um terço" },
          { originalLabel: "B", text: "três quartos" },
        ],
      },
    });

    const result = await runAdaptationAgent({
      prompt: "Adapte a questão.",
      instructions: "Adapte com linguagem simples.",
      model: {} as never,
      alternatives: [
        { label: "A", text: "1/3" },
        { label: "B", text: "3/4" },
      ],
      correctAnswer: "B",
    });

    expect(result).toEqual({
      adaptedContent: "Quanto é metade mais um quarto?",
      adaptedAlternatives: [
        {
          id: "alt-0",
          label: "A",
          originalText: "1/3",
          adaptedText: "um terço",
          isCorrect: false,
          position: 0,
        },
        {
          id: "alt-1",
          label: "B",
          originalText: "3/4",
          adaptedText: "três quartos",
          isCorrect: true,
          position: 1,
        },
      ],
    });
  });

  it("maps reduced alternatives by original label", async () => {
    const { runAdaptationAgent } = await import("@/mastra/agents/analysis-agent-runners");

    adaptationGenerate.mockResolvedValueOnce({
      object: {
        adaptedStatement: "Quanto é metade mais um quarto?",
        adaptedAlternatives: [
          { originalLabel: "A", text: "um terço" },
          { originalLabel: "C", text: "três quartos" },
        ],
      },
    });

    const result = await runAdaptationAgent({
      prompt: "Adapte a questão.",
      instructions: "Reduza alternativas.",
      model: {} as never,
      alternatives: [
        { label: "A", text: "1/3" },
        { label: "B", text: "2/3" },
        { label: "C", text: "3/4" },
        { label: "D", text: "1/4" },
      ],
      correctAnswer: "C",
    });

    expect(result).toEqual({
      adaptedContent: "Quanto é metade mais um quarto?",
      adaptedAlternatives: [
        {
          id: "alt-0",
          label: "A",
          originalText: "1/3",
          adaptedText: "um terço",
          isCorrect: false,
          position: 0,
        },
        {
          id: "alt-1",
          label: "C",
          originalText: "3/4",
          adaptedText: "três quartos",
          isCorrect: true,
          position: 1,
        },
      ],
    });
  });

  it("throws when the adapted alternatives do not include the correct answer", async () => {
    const { runAdaptationAgent } = await import("@/mastra/agents/analysis-agent-runners");

    adaptationGenerate.mockResolvedValueOnce({
      object: {
        adaptedStatement: "Quanto é metade mais um quarto?",
        adaptedAlternatives: [
          { originalLabel: "A", text: "um terço" },
          { originalLabel: "B", text: "dois terços" },
        ],
      },
    });

    await expect(
      runAdaptationAgent({
        prompt: "Adapte a questão.",
        instructions: "Reduza alternativas.",
        model: {} as never,
        alternatives: [
          { label: "A", text: "1/3" },
          { label: "B", text: "2/3" },
          { label: "C", text: "3/4" },
        ],
        correctAnswer: "C",
      }),
    ).rejects.toThrow("A alternativa correta (C) foi removida pelo agente de adaptação.");
  });

  it("throws when the agent returns an unknown original label", async () => {
    const { runAdaptationAgent } = await import("@/mastra/agents/analysis-agent-runners");

    adaptationGenerate.mockResolvedValueOnce({
      object: {
        adaptedStatement: "Enunciado adaptado",
        adaptedAlternatives: [
          { originalLabel: "Z", text: "alternativa fantasma" },
        ],
      },
    });

    await expect(
      runAdaptationAgent({
        prompt: "Adapte a questão.",
        instructions: "Adapte.",
        model: {} as never,
        alternatives: [
          { label: "A", text: "1/3" },
          { label: "B", text: "3/4" },
        ],
        correctAnswer: "B",
      }),
    ).rejects.toThrow('O agente retornou a alternativa "Z" que não existe na questão original.');
  });
});
