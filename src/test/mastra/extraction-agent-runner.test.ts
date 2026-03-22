import { describe, expect, it, vi } from "vitest";

const extractionGenerate = vi.fn();

vi.mock("@/mastra/agents/extraction-agent", () => ({
  createExtractionAgent: vi.fn(() => ({
    generate: extractionGenerate,
  })),
}));

describe("extraction agent runner", () => {
  it("sends the PDF as a file content part and returns structured questions", async () => {
    const { runPdfExtractionAgent } = await import("@/mastra/agents/extraction-agent-runner");

    extractionGenerate.mockResolvedValueOnce({
      object: {
        questions: [
          {
            orderNum: 1,
            content: "Quanto é 2 + 2?",
            questionType: "objective",
            alternatives: [
              { label: "A", text: "3" },
              { label: "B", text: "4" },
            ],
            visualElements: null,
            extractionWarning: null,
          },
        ],
      },
    });

    const pdfData = new Uint8Array([1, 2, 3]);
    const result = await runPdfExtractionAgent({
      prompt: "Extraia as questões.",
      model: {
        id: "model-1",
        name: "GPT 5.4",
        provider: "openai",
        modelId: "gpt-5.4",
        baseUrl: "https://api.openai.com/v1",
        apiKey: "secret",
        enabled: true,
        isDefault: true,
      },
      pdfData,
      contentType: "application/pdf",
    });

    expect(extractionGenerate).toHaveBeenCalledWith(
      [
        {
          role: "user",
          content: [
            { type: "text", text: "Extraia as questões." },
            { type: "file", data: pdfData, mediaType: "application/pdf" },
          ],
        },
      ],
      expect.objectContaining({
        structuredOutput: expect.any(Object),
      }),
    );
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]).toEqual({
      orderNum: 1,
      content: "Quanto é 2 + 2?",
      questionType: "objective",
      alternatives: [
        { label: "A", text: "3" },
        { label: "B", text: "4" },
      ],
      visualElements: null,
      extractionWarning: null,
    });
  });
});
