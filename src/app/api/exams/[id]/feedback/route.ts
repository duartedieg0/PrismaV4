import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/gateways/supabase/server";
import { apiForbidden, apiInternalError, apiSuccess, apiUnauthorized, apiValidationError } from "@/services/errors/api-response";

const saveFeedbackSchema = z.object({
  adaptationId: z.string().uuid("ID da adaptação inválido."),
  rating: z
    .number()
    .int()
    .min(0, "A nota deve ser no mínimo 0.")
    .max(5, "A nota deve ser no máximo 5."),
  comment: z
    .string()
    .max(5000, "O comentário deve ter no máximo 5.000 caracteres.")
    .optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { id: examId } = await params;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, user_id")
    .eq("id", examId)
    .single();

  if (examError || !exam || exam.user_id !== user.id) {
    return apiForbidden();
  }

  const body = await request.json();
  const parsed = saveFeedbackSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const { data: existingFeedback } = await supabase
    .from("feedbacks")
    .select("id")
    .eq("adaptation_id", parsed.data.adaptationId)
    .maybeSingle();

  if (existingFeedback) {
    const { data, error } = await supabase
      .from("feedbacks")
      .update({
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
      })
      .eq("id", existingFeedback.id)
      .select()
      .single();

    if (error) {
      return apiInternalError(error.message);
    }

    return apiSuccess(data);
  }

  const { data, error } = await supabase
    .from("feedbacks")
    .insert({
      adaptation_id: parsed.data.adaptationId,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    })
    .select()
    .single();

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess(data, 201);
}
