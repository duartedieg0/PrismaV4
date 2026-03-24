import type { ExtractionRequest } from "@/features/exams/extraction/contracts";

/**
 * @deprecated Gateway legado isolado fora da trilha principal.
 * Mantido apenas para testes de compatibilidade até a remoção do pipeline antigo.
 */
export type LegacyExtractionGateway = {
  invoke(request: ExtractionRequest): Promise<{
    questions: Array<{
      orderNum: number;
      content: string;
      questionType: "objective" | "essay";
      alternatives: Array<{ label: string; text: string }> | null;
      visualElements: Array<{ type: string; description: string }> | null;
      extractionWarning: string | null;
    }>;
  }>;
};

export async function runLegacyExtraction(
  gateway: LegacyExtractionGateway,
  request: ExtractionRequest,
) {
  return gateway.invoke(request);
}
