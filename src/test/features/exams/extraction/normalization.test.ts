import { describe, expect, it } from "vitest";
import { normalizeExtractionPayload } from "@/features/exams/extraction/normalization";

describe("extraction normalization", () => {
  it("normalizes extracted questions, preserves warnings and sorts by order", () => {
    const result = normalizeExtractionPayload({
      questions: [
        {
          orderNum: 2,
          content: "Explique o ciclo da água.",
          questionType: "essay",
          alternatives: null,
          visualElements: [{ type: "diagram", description: "Esquema do ciclo da água." }],
          extractionWarning: null,
        },
        {
          orderNum: 1,
          content: "Quanto é 2 + 2?",
          questionType: "objective",
          alternatives: [
            { label: "A", text: "3" },
            { label: "B", text: "4" },
          ],
          visualElements: null,
          extractionWarning: "O enunciado pode estar parcialmente cortado.",
        },
      ],
    });

    expect(result.outcome).toBe("success");
    expect(result.status).toBe("awaiting_answers");
    expect(result.questions.map((question) => question.orderNum)).toEqual([1, 2]);
    expect(result.warnings).toEqual(["O enunciado pode estar parcialmente cortado."]);
    expect(result.questions[1]?.visualElements).toEqual([
      { type: "diagram", description: "Esquema do ciclo da água." },
    ]);
  });

  it("fails explicitly when no valid questions are found", () => {
    const result = normalizeExtractionPayload({
      questions: [],
    });

    expect(result).toEqual({
      outcome: "error",
      status: "error",
      questions: [],
      warnings: [],
      fatalErrorMessage:
        "Nenhuma questão válida foi encontrada no PDF. Revise o arquivo enviado.",
    });
  });

  it("filters invalid questions instead of discarding the whole extraction when possible", () => {
    const result = normalizeExtractionPayload({
      questions: [
        {
          orderNum: 0,
          content: "",
          questionType: "objective",
          alternatives: [],
          visualElements: null,
          extractionWarning: null,
        },
        {
          orderNum: 3,
          content: "Qual é a capital do Brasil?",
          questionType: "objective",
          alternatives: [
            { label: "A", text: "Brasília" },
            { label: "B", text: "Rio de Janeiro" },
          ],
          visualElements: null,
          extractionWarning: null,
        },
      ],
    });

    expect(result.outcome).toBe("success");
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]?.orderNum).toBe(3);
  });
});
