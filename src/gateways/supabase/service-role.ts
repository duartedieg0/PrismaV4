import { createClient } from "@supabase/supabase-js";

export function createServiceRoleClient() {
  const adminKey =
    process.env.SUPABASE_SECRET_API_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !adminKey) {
    return null;
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    adminKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
