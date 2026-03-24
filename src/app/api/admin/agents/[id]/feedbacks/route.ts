import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { createClient } from "@/gateways/supabase/server";
import { apiInternalError, apiSuccess } from "@/services/errors/api-response";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const { id: agentId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedbacks")
    .select(`
      id,
      rating,
      comment,
      created_at,
      dismissed_from_evolution,
      adaptations!inner(
        adapted_content,
        support_id,
        supports!inner(
          name,
          agent_id
        ),
        questions!inner(
          content
        )
      )
    `)
    .eq("adaptations.supports.agent_id", agentId)
    .not("comment", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    return apiInternalError(error.message);
  }

  const { data: evolutions } = await supabase
    .from("agent_evolutions")
    .select("feedback_ids")
    .eq("agent_id", agentId);

  const usedFeedbackIds = new Set<string>();

  for (const evolution of evolutions ?? []) {
    const ids = evolution.feedback_ids as string[] | null;

    if (!ids) {
      continue;
    }

    for (const feedbackId of ids) {
      usedFeedbackIds.add(feedbackId);
    }
  }

  const feedbacks = (data ?? []).map((feedback) => {
    const adaptation = feedback.adaptations as unknown as {
      adapted_content: string | null;
      supports: { name: string };
      questions: { content: string };
    };

    return {
      id: feedback.id,
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.created_at,
      originalContent: adaptation.questions.content,
      adaptedContent: adaptation.adapted_content,
      supportName: adaptation.supports.name,
      dismissed: feedback.dismissed_from_evolution,
      usedInEvolution: usedFeedbackIds.has(feedback.id),
    };
  });

  return apiSuccess(feedbacks);
}
