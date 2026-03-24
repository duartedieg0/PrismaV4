import type { AdaptedAlternative, CopyableBlock } from "@/domains/adaptations/contracts";
import type { QuestionType } from "@/domains/exams/contracts";

type CreateCopyableBlockInput = {
  adaptedContent: string;
  questionType: QuestionType;
  adaptedAlternatives: AdaptedAlternative[] | null;
};

type BuildExamCopyBlockInput = {
  examTitle: string;
  supportName: string;
  questions: Array<{
    orderNum: number;
    copyBlock: CopyableBlock;
  }>;
};

export function createCopyableBlock({
  adaptedContent,
  questionType,
  adaptedAlternatives,
}: CreateCopyableBlockInput): CopyableBlock {
  if (!adaptedAlternatives || adaptedAlternatives.length === 0) {
    return {
      type: questionType,
      text: adaptedContent,
    };
  }

  const alternativesText = [...adaptedAlternatives]
    .sort((left, right) => left.position - right.position)
    .map((alternative, index) => {
      const label = `${String.fromCharCode(97 + index)})`;
      const suffix = alternative.isCorrect ? " ✓" : "";
      return `${label} ${alternative.adaptedText}${suffix}`;
    })
    .join("\n");

  return {
    type: questionType,
    text: `${adaptedContent}\n\n${alternativesText}`,
  };
}

export function buildExamCopyBlock({
  examTitle,
  supportName,
  questions,
}: BuildExamCopyBlockInput): string {
  const header = [examTitle, `Apoio: ${supportName}`].join("\n");
  const body = questions
    .map((question) => `Questão ${question.orderNum}\n${question.copyBlock.text}`)
    .join("\n\n");

  return `${header}\n\n${body}`.trim();
}
