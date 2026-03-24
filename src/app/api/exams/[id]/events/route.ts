import { NextResponse } from "next/server";
import { z } from "zod";
import { recordResultEvent } from "@/features/exams/results/record-result-event";
import { createClient } from "@/gateways/supabase/server";
import { logInfo } from "@/services/observability/logger";
import { createRequestContext } from "@/services/runtime/request-context";

const resultEventSchema = z.object({
  type: z.enum([
    "result_viewed",
    "adaptation_copied",
    "exam_copy_compiled",
    "feedback_submitted",
    "feedback_dismissed",
  ]),
  examId: z.string().optional(),
  questionId: z.string().optional(),
  adaptationId: z.string().optional(),
  supportId: z.string().optional(),
  copiedTextLength: z.number().int().optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
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
    .select("id, user_id")
    .eq("id", examId)
    .single();

  if (examError || !exam || exam.user_id !== user.id) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = resultEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await recordResultEvent(
    {
      ...parsed.data,
      examId,
    },
    {
      persistEvent: async () => {
        logInfo("Evento de resultado registrado", createRequestContext({ examId }));
      },
    },
  );

  return NextResponse.json({ accepted: true }, { status: 202 });
}
