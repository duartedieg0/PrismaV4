import { NextResponse, after } from "next/server";
import { createExam } from "@/features/exams/create/create-exam";
import { createExamInputSchema, validatePdfFile } from "@/features/exams/create/validation";
import { createClient } from "@/gateways/supabase/server";
import { runPdfExtractionAgent } from "@/mastra/agents/extraction-agent-runner";
import { runExtraction } from "@/services/ai/run-extraction";
import { logError } from "@/services/observability/logger";
import { createRequestContext } from "@/services/runtime/request-context";

export const maxDuration = 300;

function getFirstValidationMessage(fieldErrors: Record<string, string[] | undefined>) {
  for (const messages of Object.values(fieldErrors)) {
    if (messages?.[0]) {
      return messages[0];
    }
  }

  return "Dados inválidos para criar a adaptação.";
}

function parseSupportIds(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isMultipartFile(value: unknown): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "name" in value &&
      "type" in value &&
      "size" in value &&
      "arrayBuffer" in value,
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const uploadedFile = isMultipartFile(file) ? file : null;
  const supportIds = parseSupportIds(formData.get("supportIds"));

  if (!supportIds) {
    return NextResponse.json(
      { error: "Formato inválido para apoios selecionados." },
      { status: 400 },
    );
  }

  const pdfError = validatePdfFile(uploadedFile);

  const validation = createExamInputSchema.safeParse({
    subjectId: formData.get("subjectId"),
    gradeLevelId: formData.get("gradeLevelId"),
    topic: typeof formData.get("topic") === "string" && formData.get("topic")?.toString().trim()
      ? formData.get("topic")?.toString().trim()
      : undefined,
    supportSelections: supportIds.map((supportId) => ({
      supportId,
    })),
    uploadedPdf: {
      fileName: uploadedFile?.name ?? "",
      fileType: uploadedFile?.type ?? "",
      fileSize: uploadedFile?.size ?? 0,
    },
  });

  if (!validation.success || pdfError || !uploadedFile) {
    return NextResponse.json(
      {
        error: pdfError ?? getFirstValidationMessage(
          validation.success ? {} : validation.error.flatten().fieldErrors,
        ),
      },
      { status: 400 },
    );
  }

  const fileData = new Uint8Array(await uploadedFile.arrayBuffer());
  const contentType = uploadedFile.type;

  try {
    const result = await createExam({
      actorUserId: user.id,
      input: {
        ...validation.data,
        uploadedPdf: {
          ...validation.data.uploadedPdf,
          fileData,
        },
      },
      dependencies: {
        insertExam: async ({ userId, subjectId, gradeLevelId, topic, status }) =>
          supabase
            .from("exams")
            .insert({
              user_id: userId,
              subject_id: subjectId,
              grade_level_id: gradeLevelId,
              topic,
              status,
              pdf_path: "",
            })
            .select("id")
            .single(),
        updateExam: async ({ examId, patch }) =>
          supabase.from("exams").update({
            ...(patch.pdfPath ? { pdf_path: patch.pdfPath } : {}),
            ...(patch.status ? { status: patch.status } : {}),
          }).eq("id", examId),
        deleteExam: async ({ examId }) => supabase.from("exams").delete().eq("id", examId),
        deletePdf: async ({ filePath }) =>
          supabase.storage.from("exams").remove([filePath]).then((r) => ({
            error: r.error,
          })),
        insertExamSupports: async ({ examId, supportIds: nextSupportIds }) =>
          supabase.from("exam_supports").insert(
            nextSupportIds.map((supportId) => ({
              exam_id: examId,
              support_id: supportId,
            })),
          ),
        uploadPdf: async ({ filePath, fileData: data, contentType: ct }) =>
          supabase.storage.from("exams").upload(filePath, data, {
            contentType: ct,
            upsert: false,
          }),
        invokeExtraction: async () => ({ error: null }),
      },
    });

    after(async () => {
      const ctx = createRequestContext({ examId: result.examId });
      try {
        const extractionSupabase = await createClient();
        const extractionResult = await runExtraction(
          {
            examId: result.examId,
            initiatedBy: user.id,
            pdfPath: result.pdfPath,
          },
          {
            listModels: async () => {
              const { data, error } = await extractionSupabase
                .from("ai_models")
                .select("id, name, provider, base_url, api_key, model_id, enabled, is_default")
                .eq("enabled", true);

              if (error) {
                throw new Error("Erro ao carregar modelos de IA.");
              }

              return (data ?? []).map((model) => ({
                id: model.id,
                name: model.name,
                provider: model.provider,
                modelId: model.model_id,
                baseUrl: model.base_url,
                apiKey: model.api_key,
                enabled: model.enabled,
                isDefault: model.is_default,
              }));
            },
            runExtractionAgent: async ({ prompt, model }) =>
              runPdfExtractionAgent({
                prompt,
                model,
                pdfData: fileData,
                contentType,
              }),
            persistExtraction: async ({ examId: workflowExamId, status, errorMessage, questions }) => {
              if (status === "error") {
                await extractionSupabase
                  .from("exams")
                  .update({ status: "error", error_message: errorMessage })
                  .eq("id", workflowExamId);

                return { warnings: [], questionsCount: 0 };
              }

              await extractionSupabase.from("questions").delete().eq("exam_id", workflowExamId);
              if (questions.length > 0) {
                await extractionSupabase.from("questions").insert(
                  questions.map((question) => ({
                    exam_id: workflowExamId,
                    order_num: question.orderNum,
                    content: question.content,
                    question_type: question.questionType,
                    alternatives: question.alternatives,
                    visual_elements: question.visualElements,
                    extraction_warning: question.extractionWarning,
                  })),
                );
              }

              await extractionSupabase
                .from("exams")
                .update({ status: "awaiting_answers", error_message: errorMessage })
                .eq("id", workflowExamId);

              return {
                warnings: questions
                  .flatMap((q) => q.extractionWarning ? [q.extractionWarning] : []),
                questionsCount: questions.length,
              };
            },
            registerEvent: async () => {},
          },
        );

        if (extractionResult.outcome === "error") {
          logError("Extração falhou", ctx, new Error(extractionResult.failure.message));
        }
      } catch (error) {
        logError("Falha na extração em background", ctx, error);
        const fallbackSupabase = await createClient();
        await fallbackSupabase
          .from("exams")
          .update({
            status: "error",
            error_message: error instanceof Error ? error.message : "Erro na extração.",
          })
          .eq("id", result.examId);
      }
    });

    return NextResponse.json({ examId: result.examId }, { status: 202 });
  } catch (error) {
    logError("Falha ao criar exame", createRequestContext(), error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao criar exame.",
      },
      { status: 500 },
    );
  }
}
