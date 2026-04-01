import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/gateways/supabase/server";
import { apiUnauthorized, apiInternalError } from "@/services/errors/api-response";
import { logError } from "@/services/observability/logger";
import { createRequestContext } from "@/services/runtime/request-context";

export type TeacherContext = {
  supabase: SupabaseClient;
  userId: string;
};

type TeacherRouteHandler = (
  ctx: TeacherContext,
  request: Request,
) => Promise<Response>;

export function withTeacherRoute(handler: TeacherRouteHandler) {
  return async (
    request: Request,
    routeContext?: { params: Promise<Record<string, string>> },
  ) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized();
    }

    try {
      return await handler({ supabase, userId: user.id }, request);
    } catch (error) {
      logError("Erro em rota do professor", createRequestContext(), error);
      return apiInternalError();
    }
  };
}
