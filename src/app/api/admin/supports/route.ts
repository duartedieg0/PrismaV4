import { withAdminRoute } from "@/app/api/admin/with-admin-route";
import { toAdminSupportView } from "@/features/admin/supports/service";
import { createSupportSchema } from "@/features/admin/supports/validation";
import { apiSuccess, apiValidationError, apiInternalError, apiError } from "@/services/errors/api-response";

export const GET = withAdminRoute(async ({ supabase }) => {
  const { data, error } = await supabase
    .from("supports")
    .select("id, name, agent_id, model_id, enabled, created_at, agents(name), ai_models(name, model_id)")
    .order("name");

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess((data ?? []).map((item) => toAdminSupportView(item as never)));
});

export const POST = withAdminRoute(async ({ supabase }, request) => {
  const parsed = createSupportSchema.safeParse(await request.json());

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const [{ data: agent }, { data: model }] = await Promise.all([
    supabase.from("agents").select("id, enabled").eq("id", parsed.data.agentId).single(),
    parsed.data.modelId
      ? supabase.from("ai_models").select("id, enabled").eq("id", parsed.data.modelId).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!agent?.id || !agent.enabled) {
    return apiError("VALIDATION_ERROR", "Selecione um agente habilitado.", 400);
  }

  if (parsed.data.modelId && (!model?.id || !model.enabled)) {
    return apiError("VALIDATION_ERROR", "Selecione um modelo habilitado.", 400);
  }

  const { data, error } = await supabase
    .from("supports")
    .insert({
      name: parsed.data.name,
      agent_id: parsed.data.agentId,
      model_id: parsed.data.modelId,
      enabled: parsed.data.enabled ?? true,
    })
    .select("id, name, agent_id, model_id, enabled, created_at, agents(name), ai_models(name, model_id)")
    .single();

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess(toAdminSupportView(data as never), 201);
});
