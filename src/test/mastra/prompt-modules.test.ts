import { describe, expect, it } from "vitest";
import { buildAdaptationPrompt } from "@/mastra/prompts/adaptation-prompt";
import { buildBloomPrompt } from "@/mastra/prompts/bloom-prompt";
import { buildBnccPrompt } from "@/mastra/prompts/bncc-prompt";
import { buildExtractionPrompt } from "@/mastra/prompts/extraction-prompt";

describe("mastra prompt modules", () => {
  it("renders the extraction prompt with structured-output guidance", () => {
    expect(buildExtractionPrompt()).toMatch(/retorne a saída estruturada/i);
  });

  it("renders BNCC and Bloom prompts with the pedagogical context", () => {
    const bnccPrompt = buildBnccPrompt({
      subject: "Matemática",
      gradeLevel: "7º ano",
      topic: "Frações",
      questionContent: "Quanto é 1/2 + 1/4?",
      alternativesText: "A) 1/3\nB) 3/4",
    });
    const bloomPrompt = buildBloomPrompt({
      questionContent: "Quanto é 1/2 + 1/4?",
      alternativesText: "A) 1/3\nB) 3/4",
    });

    expect(bnccPrompt).toContain("Disciplina: Matemática");
    expect(bloomPrompt).toContain("Taxonomia de Bloom");
  });

  it("renders adaptation prompts differently for essay and objective questions", () => {
    const essayPrompt = buildAdaptationPrompt({
      agentPrompt: "Adapte com linguagem simples.",
      subjectName: "História",
      gradeLevelName: "8º ano",
      topicName: "Brasil República",
      correctAnswer: "Resposta livre",
      questionContent: "Explique a Proclamação da República.",
      alternatives: null,
      supportName: "Dislexia",
    });
    const objectivePrompt = buildAdaptationPrompt({
      agentPrompt: "Adapte com linguagem simples.",
      subjectName: "Geografia",
      gradeLevelName: "6º ano",
      topicName: "Capitais",
      correctAnswer: "B",
      questionContent: "Qual é a capital do Brasil?",
      alternatives: [
        { label: "A", text: "São Paulo" },
        { label: "B", text: "Brasília" },
      ],
      supportName: "TDAH",
    });

    expect(essayPrompt).toMatch(/retorne apenas o texto da questão adaptada/i);
    expect(objectivePrompt).toMatch(/retorne sua resposta no seguinte formato json/i);
    expect(objectivePrompt).toContain("originalLabel");
    expect(objectivePrompt).toContain("Você PODE reduzir a quantidade de alternativas");
  });
});
