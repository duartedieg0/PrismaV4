import { createServiceRoleClient } from "@/gateways/supabase/service-role";

type ProfileRecord = {
  id: string;
  full_name?: string | null;
  email: string | null;
  role: "teacher" | "admin";
  blocked: boolean;
};

type GetProfileOrRedirectOptions = {
  createClient: () => Promise<{
    from(table: "profiles"): {
      select(query: string): {
        eq(column: "id", value: string): {
          single(): PromiseLike<{
            data: ProfileRecord | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
    auth: {
      getUser(): Promise<{
        data: { user: { id: string; email?: string | null } | null };
        error: { message: string } | null;
      }>;
    };
  }>;
};

async function readProfileWithFallback(
  createClient: GetProfileOrRedirectOptions["createClient"],
  userId: string,
) {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, blocked")
    .eq("id", userId)
    .single();

  if (profile) {
    return profile;
  }

  if (!error) {
    return null;
  }

  const serviceRoleClient = createServiceRoleClient();

  if (!serviceRoleClient) {
    return null;
  }

  const { data: serviceProfile } = await serviceRoleClient
    .from("profiles")
    .select("id, full_name, email, role, blocked")
    .eq("id", userId)
    .maybeSingle();

  return serviceProfile;
}

export async function getProfileOrRedirect({
  createClient,
}: GetProfileOrRedirectOptions) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      kind: "redirect" as const,
      redirectTo: "/login",
      reason: "missing_session" as const,
      message: "Voce precisa entrar para continuar.",
    };
  }

  const profile = await readProfileWithFallback(createClient, user.id);

  if (!profile) {
    return {
      kind: "redirect" as const,
      redirectTo: "/login?error=missing_profile",
      reason: "missing_profile" as const,
      message: "Perfil de acesso nao encontrado.",
    };
  }

  return {
    kind: "profile" as const,
    profile,
  };
}
