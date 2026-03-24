import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { buildAgentPatch, toAdminAgentView } from "@/features/admin/agents/service";
import { updateAgentSchema } from "@/features/admin/agents/validation";
import { createClient } from "@/gateways/supabase/server";
import { apiConflict, apiInternalError, apiNotFound, apiSuccess, apiValidationError } from "@/services/errors/api-response";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id, name, objective, prompt, version, enabled, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return apiNotFound("Agente não encontrado.");
  }

  return apiSuccess(toAdminAgentView(data));
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const { id } = await params;
  const parsed = updateAgentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .update(buildAgentPatch(parsed.data))
    .eq("id", id)
    .select("id, name, objective, prompt, version, enabled, created_at, updated_at")
    .single();

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess(toAdminAgentView(data));
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const access = await requireAdminRouteAccess();

  if (access.kind === "error") {
    return access.response;
  }

  const { id } = await params;
  const supabase = await createClient();
  const { count } = await supabase
    .from("supports")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", id);

  if ((count ?? 0) > 0) {
    return apiConflict("Remova ou reconfigure os apoios vinculados antes de excluir o agente.");
  }

  const { error } = await supabase.from("agents").delete().eq("id", id);

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess({ success: true });
}
