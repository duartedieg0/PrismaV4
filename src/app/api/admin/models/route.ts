import { withAdminRoute } from "@/app/api/admin/with-admin-route";
import { createModelSchema } from "@/features/admin/models/validation";
import { toAdminModelView } from "@/features/admin/models/service";
import { apiSuccess, apiValidationError, apiInternalError } from "@/services/errors/api-response";

const MODEL_SELECT =
  "id, name, provider, base_url, api_key, model_id, enabled, is_default, system_role, created_at, input_price_per_million, output_price_per_million, cache_read_price_per_million, cache_creation_price_per_million";

export const GET = withAdminRoute(async ({ supabase }) => {
  const { data, error } = await supabase
    .from("ai_models")
    .select(MODEL_SELECT)
    .order("name");

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess((data ?? []).map(toAdminModelView));
});

export const POST = withAdminRoute(async ({ supabase }, request) => {
  const parsed = createModelSchema.safeParse(await request.json());

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  if (parsed.data.isDefault) {
    await supabase.from("ai_models").update({ is_default: false }).neq("id", "");
  }

  const { data, error } = await supabase
    .from("ai_models")
    .insert({
      name: parsed.data.name,
      provider: parsed.data.provider,
      base_url: parsed.data.baseUrl,
      api_key: parsed.data.apiKey,
      model_id: parsed.data.modelId,
      enabled: parsed.data.enabled ?? true,
      is_default: parsed.data.isDefault ?? false,
      system_role: parsed.data.systemRole ?? null,
      input_price_per_million: parsed.data.inputPricePerMillion ?? null,
      output_price_per_million: parsed.data.outputPricePerMillion ?? null,
      cache_read_price_per_million: parsed.data.cacheReadPricePerMillion ?? null,
      cache_creation_price_per_million: parsed.data.cacheCreationPricePerMillion ?? null,
    })
    .select(MODEL_SELECT)
    .single();

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess(toAdminModelView(data), 201);
});
