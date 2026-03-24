import { withAdminRoute } from "@/app/api/admin/with-admin-route";
import { toAdminUserListItem } from "@/features/admin/users/service";
import { apiSuccess, apiInternalError } from "@/services/errors/api-response";

export const GET = withAdminRoute(async ({ supabase }) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role, blocked, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return apiInternalError(error.message);
  }

  return apiSuccess((data ?? []).map(toAdminUserListItem));
});
