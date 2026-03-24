import { withAdminRoute } from "@/app/api/admin/with-admin-route";
import { toAdminAgentView } from "@/features/admin/agents/service";
import { createAgentSchema } from "@/features/admin/agents/validation";
import { apiSuccess, apiValidationError, apiInternalError } from "@/services/errors/api-response";

export const GET = withAdminRoute(async ({ supabase }) => {
  const { data, error } = await supabase
    .from("agents")
    .select("id, name, objective, prompt, version, enabled, created_at, updated_at")
    .order("name");

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess((data ?? []).map(toAdminAgentView));
});

export const POST = withAdminRoute(async ({ supabase }, request) => {
  const parsed = createAgentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const { data, error } = await supabase
    .from("agents")
    .insert({
      name: parsed.data.name,
      objective: parsed.data.objective ?? null,
      prompt: parsed.data.prompt,
      enabled: parsed.data.enabled ?? true,
    })
    .select("id, name, objective, prompt, version, enabled, created_at, updated_at")
    .single();

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess(toAdminAgentView(data), 201);
});
