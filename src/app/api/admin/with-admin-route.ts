import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { createClient } from "@/gateways/supabase/server";
import { logError } from "@/services/observability/logger";
import { createRequestContext } from "@/services/runtime/request-context";
import { apiInternalError } from "@/services/errors/api-response";

type AdminContext = {
  supabase: SupabaseClient;
  userId: string;
};

type AdminRouteHandler = (
  ctx: AdminContext,
  request: Request,
) => Promise<Response>;

export function withAdminRoute(handler: AdminRouteHandler) {
  return async (request: Request) => {
    const access = await requireAdminRouteAccess();

    if (access.kind === "error") {
      return access.response;
    }

    try {
      const supabase = await createClient();
      return await handler({ supabase, userId: access.userId }, request);
    } catch (error) {
      logError("Erro em rota admin", createRequestContext(), error);
      return apiInternalError();
    }
  };
}
