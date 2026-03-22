import type { AdaptedAlternative } from "@/domains/adaptations/contracts";
import type { QuestionAlternative, QuestionType, ExamStatus } from "@/domains/exams/contracts";
import { createCopyableBlock } from "@/features/exams/results/copyable-block";
import type { ExamResultView } from "@/features/exams/results/contracts";
import { createExamResultView } from "@/features/exams/results/contracts";

type ExamResultRecord = {
  id: string;
  user_id: string;
  status: ExamStatus;
  topic: string | null;
  created_at: string;
  subjects: { name: string } | null;
  grade_levels: { name: string } | null;
};

type ExamSupportRecord = {
  supports: {
    id: string;
    name: string;
  } | null;
};

type FeedbackRecord = {
  id: string;
  rating: number;
  comment: string | null;
};

type AdaptationRecord = {
  id: string;
  support_id: string;
  adapted_content: string | null;
  adapted_alternatives: AdaptedAlternative[] | null;
  bncc_skills: string[] | null;
  bloom_level: string | null;
  bncc_analysis: string | null;
  bloom_analysis: string | null;
  status: "pending" | "processing" | "completed" | "error";
  supports: { id: string; name: string } | null;
  feedbacks: FeedbackRecord[];
};

type QuestionRecord = {
  id: string;
  order_num: number;
  content: string;
  question_type: QuestionType;
  alternatives: QuestionAlternative[] | null;
  adaptations: AdaptationRecord[];
};

type GetExamResultDependencies = {
  loadExamResult(input: {
    examId: string;
  }): Promise<{
    exam: ExamResultRecord | null;
    examSupports: ExamSupportRecord[];
    questions: QuestionRecord[];
  }>;
};

type GetExamResultInput = {
  examId: string;
  actorUserId: string;
  dependencies: GetExamResultDependencies;
};

type GetExamResultResult =
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "processing"; status: Exclude<ExamStatus, "completed"> }
  | { kind: "success"; value: ExamResultView };

export async function getExamResult({
  examId,
  actorUserId,
  dependencies,
}: GetExamResultInput): Promise<GetExamResultResult> {
  const payload = await dependencies.loadExamResult({ examId });

  if (!payload.exam) {
    return { kind: "not_found" };
  }

  if (payload.exam.user_id !== actorUserId) {
    return { kind: "forbidden" };
  }

  if (payload.exam.status !== "completed") {
    return {
      kind: "processing",
      status: payload.exam.status,
    };
  }

  const result = createExamResultView({
    examId: payload.exam.id,
    examStatus: "completed",
    subjectName: payload.exam.subjects?.name ?? "Não especificada",
    gradeLevelName: payload.exam.grade_levels?.name ?? "Não especificado",
    topicName: payload.exam.topic ?? "Não especificado",
    supportNames: payload.examSupports
      .map((item) => item.supports?.name)
      .filter((value): value is string => Boolean(value)),
    createdAt: payload.exam.created_at,
    questions: payload.questions
      .slice()
      .sort((left, right) => left.order_num - right.order_num)
      .map((question) => ({
        questionId: question.id,
        orderNum: question.order_num,
        questionType: question.question_type,
        originalContent: question.content,
        originalAlternatives: question.alternatives,
        supports: question.adaptations.map((adaptation) => ({
          adaptationId: adaptation.id,
          supportId: adaptation.support_id,
          supportName: adaptation.supports?.name ?? "Apoio",
          status: adaptation.status,
          adaptedContent: adaptation.adapted_content,
          adaptedAlternatives: adaptation.adapted_alternatives,
          bnccSkills: adaptation.bncc_skills,
          bloomLevel: adaptation.bloom_level,
          bnccAnalysis: adaptation.bncc_analysis,
          bloomAnalysis: adaptation.bloom_analysis,
          copyBlock: adaptation.adapted_content
            ? createCopyableBlock({
                adaptedContent: adaptation.adapted_content,
                questionType: question.question_type,
                adaptedAlternatives: adaptation.adapted_alternatives,
              })
            : null,
          feedback: adaptation.feedbacks[0]
            ? {
                id: adaptation.feedbacks[0].id,
                rating: adaptation.feedbacks[0].rating,
                comment: adaptation.feedbacks[0].comment,
              }
            : null,
        })),
      })),
  });

  return {
    kind: "success",
    value: result,
  };
}
