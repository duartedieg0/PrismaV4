import { describe, expect, it } from "vitest";
import { buildExamCopyBlock, createCopyableBlock } from "@/features/exams/results/copyable-block";

describe("copyable block", () => {
  it("formats objective adaptations with alternatives and correct marker", () => {
    const block = createCopyableBlock({
      adaptedContent: "Quanto é metade mais um quarto?",
      questionType: "objective",
      adaptedAlternatives: [
        {
          id: "alt-1",
          label: "A",
          originalText: "1/3",
          adaptedText: "um terço",
          isCorrect: false,
          position: 0,
        },
        {
          id: "alt-2",
          label: "B",
          originalText: "3/4",
          adaptedText: "três quartos",
          isCorrect: true,
          position: 1,
        },
      ],
    });

    expect(block).toEqual({
      type: "objective",
      text: "Quanto é metade mais um quarto?\n\na) um terço\nb) três quartos ✓",
    });
  });

  it("formats essay adaptations as plain text", () => {
    const block = createCopyableBlock({
      adaptedContent: "Explique com suas palavras o conceito de fração.",
      questionType: "essay",
      adaptedAlternatives: null,
    });

    expect(block).toEqual({
      type: "essay",
      text: "Explique com suas palavras o conceito de fração.",
    });
  });

  it("builds a full exam block for a single support", () => {
    const text = buildExamCopyBlock({
      examTitle: "Matemática • 7º ano",
      supportName: "Dislexia",
      questions: [
        {
          orderNum: 1,
          copyBlock: {
            type: "objective",
            text: "Quanto é metade mais um quarto?\n\na) um terço\nb) três quartos ✓",
          },
        },
        {
          orderNum: 2,
          copyBlock: {
            type: "essay",
            text: "Explique o que é fração equivalente.",
          },
        },
      ],
    });

    expect(text).toContain("Matemática • 7º ano");
    expect(text).toContain("Apoio: Dislexia");
    expect(text).toContain("Questão 1");
    expect(text).toContain("Questão 2");
  });
});
