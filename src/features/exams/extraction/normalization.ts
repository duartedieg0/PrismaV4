import { createExtractionResult, type ExtractedQuestion } from "@/features/exams/extraction/contracts";

const NO_QUESTIONS_ERROR =
  "Nenhuma questão válida foi encontrada no PDF. Revise o arquivo enviado.";

type RawExtractionPayload = {
  questions: Array<{
    orderNum: number;
    content: string;
    questionType: ExtractedQuestion["questionType"];
    alternatives: ExtractedQuestion["alternatives"];
    visualElements: ExtractedQuestion["visualElements"];
    extractionWarning: string | null;
  }>;
};

function isQuestionValid(question: RawExtractionPayload["questions"][number]) {
  return question.orderNum > 0 && question.content.trim().length > 0;
}

function sortByOrder(a: ExtractedQuestion, b: ExtractedQuestion) {
  return a.orderNum - b.orderNum;
}

export function normalizeExtractionPayload(payload: RawExtractionPayload) {
  const normalizedQuestions = payload.questions
    .filter(isQuestionValid)
    .map((question) => ({
      orderNum: question.orderNum,
      content: question.content.trim(),
      questionType: question.questionType,
      alternatives: question.alternatives,
      visualElements: question.visualElements,
      extractionWarning: question.extractionWarning,
    }))
    .sort(sortByOrder);

  if (normalizedQuestions.length === 0) {
    return createExtractionResult({
      outcome: "error",
      status: "error",
      questions: [],
      warnings: [],
      fatalErrorMessage: NO_QUESTIONS_ERROR,
    });
  }

  const warnings = normalizedQuestions
    .map((question) => question.extractionWarning)
    .filter((warning): warning is string => Boolean(warning));

  return createExtractionResult({
    outcome: "success",
    status: "awaiting_answers",
    questions: normalizedQuestions,
    warnings,
    fatalErrorMessage: null,
  });
}
