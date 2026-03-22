import type { ExtractionRequest } from "@/features/exams/extraction/contracts";
import { normalizeExtractionPayload } from "@/features/exams/extraction/normalization";

/**
 * @deprecated Compat layer mantida só para cobertura de regressão da extração legada.
 * A trilha principal do produto foi migrada para `runExtraction` + `extractExamWorkflow`
 * na Fase 7. Remover este módulo junto com `runLegacyExtraction` quando o legado for
 * oficialmente descontinuado.
 */
type ProcessExtractionDependencies = {
  runLegacyExtraction(request: ExtractionRequest): Promise<{
    questions: Array<{
      orderNum: number;
      content: string;
      questionType: "objective" | "essay";
      alternatives: Array<{ label: string; text: string }> | null;
      visualElements: Array<{ type: string; description: string }> | null;
      extractionWarning: string | null;
    }>;
  }>;
  deleteQuestionsByExamId(input: { examId: string }): Promise<{
    error: { message: string } | null;
  }>;
  insertQuestions(input: {
    examId: string;
    questions: Array<{
      orderNum: number;
      content: string;
      questionType: "objective" | "essay";
      alternatives: Array<{ label: string; text: string }> | null;
      visualElements: Array<{ type: string; description: string }> | null;
      extractionWarning: string | null;
    }>;
  }): Promise<{
    error: { message: string } | null;
  }>;
  updateExamStatus(input: {
    examId: string;
    status: "awaiting_answers" | "error";
    errorMessage: string | null;
  }): Promise<{
    error: { message: string } | null;
  }>;
};

type ProcessExtractionOptions = {
  request: ExtractionRequest;
  dependencies: ProcessExtractionDependencies;
};

export async function processExtraction({
  request,
  dependencies,
}: ProcessExtractionOptions) {
  const payload = await dependencies.runLegacyExtraction(request);
  const result = normalizeExtractionPayload(payload);

  if (result.outcome === "error") {
    await dependencies.updateExamStatus({
      examId: request.examId,
      status: "error",
      errorMessage: result.fatalErrorMessage,
    });

    return result;
  }

  await dependencies.deleteQuestionsByExamId({
    examId: request.examId,
  });

  const insertResult = await dependencies.insertQuestions({
    examId: request.examId,
    questions: result.questions,
  });

  if (insertResult.error) {
    throw new Error("Erro ao salvar as questões extraídas.");
  }

  await dependencies.updateExamStatus({
    examId: request.examId,
    status: "awaiting_answers",
    errorMessage: null,
  });

  return result;
}
