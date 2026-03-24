import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { selectEvolutionModel } from "@/features/admin/models/service";
import { suggestAgentEvolution } from "@/features/admin/agents/evolution/service";
import {
  evolveAgentSchema,
  resolveEvolutionSchema,
} from "@/features/admin/agents/evolution/validation";
import { createClient } from "@/gateways/supabase/server";
import { logError } from "@/services/observability/logger";
import { createRequestContext } from "@/services/runtime/request-context";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const { id: agentId } = await params;
  const parsed = evolveAgentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("id, name, objective, prompt, version")
    .eq("id", agentId)
    .single();

  if (agentError || !agent) {
    return NextResponse.json({ error: "Agente não encontrado." }, { status: 404 });
  }

  const { data: feedbackRows, error: feedbackError } = await supabase
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
    .in("id", parsed.data.feedbackIds)
    .eq("adaptations.supports.agent_id", agentId);

  if (feedbackError) {
    return NextResponse.json({ error: feedbackError.message }, { status: 500 });
  }

  const eligibleFeedbacks = (feedbackRows ?? [])
    .filter((feedback) => feedback.comment)
    .map((feedback) => {
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
        usedInEvolution: false,
      };
    })
    .filter((feedback) => !feedback.dismissed);

  if (eligibleFeedbacks.length === 0) {
    return NextResponse.json(
      { error: "Nenhum feedback elegível foi encontrado para evolução." },
      { status: 400 },
    );
  }

  const { data: models, error: modelError } = await supabase
    .from("ai_models")
    .select("id, name, provider, base_url, api_key, model_id, enabled, is_default, system_role, created_at");

  if (modelError) {
    return NextResponse.json({ error: modelError.message }, { status: 500 });
  }

  const evolutionModel = selectEvolutionModel(models ?? []);

  if (!evolutionModel) {
    return NextResponse.json({ error: "Nenhum modelo habilitado foi encontrado para evolução." }, { status: 400 });
  }

  try {
    const suggestion = await suggestAgentEvolution({
      agentId,
      agentName: agent.name,
      objective: agent.objective,
      currentPrompt: agent.prompt,
      currentVersion: agent.version,
      initiatedBy: access.userId,
      model: evolutionModel,
      feedbacks: eligibleFeedbacks,
      persistEvolution: async (payload) => {
        const { data, error } = await supabase
          .from("agent_evolutions")
          .insert({
            agent_id: payload.agentId,
            original_prompt: payload.originalPrompt,
            suggested_prompt: payload.suggestedPrompt,
            llm_commentary: payload.commentary,
            feedback_ids: payload.feedbackIds,
            current_version: payload.currentVersion,
            suggested_version: payload.suggestedVersion,
            initiated_by: payload.initiatedBy,
            model_id: payload.modelId,
            prompt_version: payload.promptVersion,
          })
          .select("id")
          .single();

        if (error || !data) {
          throw new Error(error?.message ?? "Não foi possível persistir a evolução.");
        }

        return {
          evolutionId: data.id,
        };
      },
    });

    return NextResponse.json(suggestion);
  } catch (error) {
    logError("Falha ao evoluir agente", createRequestContext(), error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao evoluir agente.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const { id: agentId } = await params;
  const parsed = resolveEvolutionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = await createClient();

  if (parsed.data.accepted) {
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("version")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agente não encontrado." }, { status: 404 });
    }

    const acceptedVersion = agent.version + 1;

    const { error: traceError } = await supabase
      .from("agent_evolutions")
      .update({
        accepted: true,
        accepted_version: acceptedVersion,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.evolutionId)
      .eq("agent_id", agentId);

    if (traceError) {
      return NextResponse.json({ error: traceError.message }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("agents")
      .update({
        prompt: parsed.data.suggestedPrompt,
        version: acceptedVersion,
      })
      .eq("id", agentId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    const { error: traceError } = await supabase
      .from("agent_evolutions")
      .update({
        accepted: false,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.evolutionId)
      .eq("agent_id", agentId);

    if (traceError) {
      return NextResponse.json({ error: traceError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
