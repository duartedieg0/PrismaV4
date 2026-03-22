import { NextResponse } from "next/server";
import { z } from "zod";
import { runAnalysisAndAdaptation } from "@/services/ai/run-analysis-and-adaptation";
import { createClient } from "@/gateways/supabase/server";
import {
  runAdaptationAgent,
  runBloomAnalysisAgent,
  runBnccAnalysisAgent,
} from "@/mastra/agents/analysis-agent-runners";

const submitAnswersSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      correctAnswer: z.string(),
    }),
  ),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ExamContextRecord = {
  id: string;
  topic: string | null;
  subjects: { name: string } | null;
  grade_levels: { name: string } | null;
};

type QuestionContextRecord = {
  id: string;
  order_num: number;
  content: string;
  question_type: "objective" | "essay";
  alternatives: Array<{ label: string; text: string }> | null;
  correct_answer: string | null;
};

type SupportJoinRecord = {
  supports: {
    id: string;
    name: string;
    agent_id: string;
    model_id: string;
    agents: { prompt: string; version: number } | null;
    ai_models: {
      id: string;
      name: string;
      provider: string;
      base_url: string;
      api_key: string;
      model_id: string;
      enabled: boolean;
      is_default: boolean;
    } | null;
  } | null;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { id: examId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, user_id, status")
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    return NextResponse.json({ error: "Exame não encontrado." }, { status: 404 });
  }

  if (exam.user_id !== user.id) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  if (exam.status !== "awaiting_answers") {
    return NextResponse.json(
      { error: "Este exame não está aguardando respostas." },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = submitAnswersSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  for (const answer of parsed.data.answers) {
    if (!answer.correctAnswer.trim()) {
      continue;
    }

    await supabase
      .from("questions")
      .update({ correct_answer: answer.correctAnswer })
      .eq("id", answer.questionId)
      .eq("exam_id", examId);
  }

  await supabase
    .from("exams")
    .update({ status: "analyzing" })
    .eq("id", examId);

  try {
    const result = await runAnalysisAndAdaptation(
      {
        examId,
        initiatedBy: user.id,
      },
      {
        loadExamContext: async ({ examId: workflowExamId }) => {
          const { data: exam } = await supabase
            .from("exams")
            .select("id, topic, subjects(name), grade_levels(name)")
            .eq("id", workflowExamId)
            .single();
          const { data: questions } = await supabase
            .from("questions")
            .select("id, order_num, content, question_type, alternatives, correct_answer")
            .eq("exam_id", workflowExamId)
            .order("order_num");
          const { data: supports } = await supabase
            .from("exam_supports")
            .select("support_id, supports(id, name, agent_id, model_id, agents(prompt, version), ai_models(id, name, provider, base_url, api_key, model_id, enabled, is_default))")
            .eq("exam_id", workflowExamId);

          return {
            exam: {
              id: workflowExamId,
              subjectName: (exam as ExamContextRecord | null)?.subjects?.name ?? "Não especificada",
              gradeLevelName: (exam as ExamContextRecord | null)?.grade_levels?.name ?? "Não especificado",
              topicName: (exam as ExamContextRecord | null)?.topic ?? "Não especificado",
            },
            questions: ((questions ?? []) as QuestionContextRecord[]).map((question) => ({
              id: question.id,
              orderNum: question.order_num,
              content: question.content,
              questionType: question.question_type,
              alternatives: Array.isArray(question.alternatives)
                ? question.alternatives as Array<{ label: string; text: string }>
                : null,
              correctAnswer: question.correct_answer,
            })),
            supports: ((supports ?? []) as unknown as SupportJoinRecord[])
              .filter((item): item is SupportJoinRecord & { supports: NonNullable<SupportJoinRecord["supports"]> } =>
                Boolean(item.supports?.agents && item.supports.ai_models),
              )
              .map((item) => ({
              id: item.supports.id,
              name: item.supports.name,
              agentId: item.supports.agent_id,
              agentVersion: item.supports.agents?.version ?? 1,
              modelId: item.supports.model_id,
              prompt: item.supports.agents?.prompt ?? "",
              model: {
                id: item.supports.ai_models?.id ?? "",
                name: item.supports.ai_models?.name ?? "",
                provider: item.supports.ai_models?.provider ?? "openai",
                modelId: item.supports.ai_models?.model_id ?? "",
                baseUrl: item.supports.ai_models?.base_url ?? "",
                apiKey: item.supports.ai_models?.api_key ?? "",
                enabled: item.supports.ai_models?.enabled ?? false,
                isDefault: item.supports.ai_models?.is_default ?? false,
              },
            })),
          };
        },
        createPendingAdaptations: async ({ questionIds, supportIds }) => {
          const rows = questionIds.flatMap((questionId) =>
            supportIds.map((supportId) => ({
              question_id: questionId,
              support_id: supportId,
              status: "pending" as const,
            })),
          );

          await supabase.from("adaptations").insert(rows);
        },
        persistAdaptation: async (input) => {
          const patch: Record<string, unknown> = {
            status: input.status,
          };

          if (input.agentVersion !== undefined) patch.agent_version = input.agentVersion;
          if (input.promptVersion !== undefined) patch.prompt_version = input.promptVersion;
          if (input.bnccSkills !== undefined) patch.bncc_skills = input.bnccSkills;
          if (input.bloomLevel !== undefined) patch.bloom_level = input.bloomLevel;
          if (input.bnccAnalysis !== undefined) patch.bncc_analysis = input.bnccAnalysis;
          if (input.bloomAnalysis !== undefined) patch.bloom_analysis = input.bloomAnalysis;
          if (input.adaptedContent !== undefined) patch.adapted_content = input.adaptedContent;
          if (input.adaptedAlternatives !== undefined) {
            patch.adapted_alternatives = input.adaptedAlternatives;
          }

          await supabase
            .from("adaptations")
            .update(patch)
            .eq("question_id", input.questionId)
            .eq("support_id", input.supportId);
        },
        updateExamStatus: async ({ examId: workflowExamId, status, errorMessage }) => {
          await supabase
            .from("exams")
            .update({
              status,
              ...(errorMessage !== undefined ? { error_message: errorMessage } : {}),
            })
            .eq("id", workflowExamId);
        },
        runBnccAnalysis: runBnccAnalysisAgent,
        runBloomAnalysis: runBloomAnalysisAgent,
        runAdaptation: runAdaptationAgent,
        registerEvent: async () => {},
      },
    );
    if (result.outcome === "error") {
      return NextResponse.json(
        { error: result.failure.message },
        { status: 500 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Erro ao iniciar a adaptação." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
