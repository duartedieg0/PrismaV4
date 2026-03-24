import { describe, expect, it } from "vitest";
import { parseAdaptationPayload } from "@/mastra/workflows/analyze-and-adapt-workflow";

describe("parseAdaptationPayload", () => {
  it("returns plain text for essay questions (no alternatives)", () => {
    const result = parseAdaptationPayload(
      "  Texto adaptado da dissertativa.  ",
      null,
      null,
    );

    expect(result).toEqual({
      adaptedContent: "Texto adaptado da dissertativa.",
      adaptedAlternatives: null,
    });
  });

  it("parses label-based alternatives from clean JSON", () => {
    const json = JSON.stringify({
      adaptedStatement: "Quanto é metade mais um quarto?",
      adaptedAlternatives: [
        { originalLabel: "A", text: "um terço" },
        { originalLabel: "C", text: "três quartos" },
      ],
    });

    const result = parseAdaptationPayload(
      json,
      [
        { label: "A", text: "1/3" },
        { label: "B", text: "2/3" },
        { label: "C", text: "3/4" },
      ],
      "C",
    );

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

  it("extracts JSON from markdown code blocks", () => {
    const text = 'Some preamble\n```json\n{"adaptedStatement": "Enunciado", "adaptedAlternatives": [{"originalLabel": "B", "text": "Adaptada B"}]}\n```';

    const result = parseAdaptationPayload(
      text,
      [
        { label: "A", text: "Original A" },
        { label: "B", text: "Original B" },
      ],
      "B",
    );

    expect(result.adaptedContent).toBe("Enunciado");
    expect(result.adaptedAlternatives).toHaveLength(1);
    expect(result.adaptedAlternatives![0]).toMatchObject({
      label: "B",
      originalText: "Original B",
      isCorrect: true,
    });
  });

  it("handles unknown originalLabel gracefully with empty originalText", () => {
    const json = JSON.stringify({
      adaptedStatement: "Enunciado",
      adaptedAlternatives: [
        { originalLabel: "Z", text: "alternativa fantasma" },
      ],
    });

    const result = parseAdaptationPayload(
      json,
      [{ label: "A", text: "Original A" }],
      "A",
    );

    expect(result.adaptedAlternatives![0]).toMatchObject({
      label: "Z",
      originalText: "",
      adaptedText: "alternativa fantasma",
      isCorrect: false,
    });
  });
});
