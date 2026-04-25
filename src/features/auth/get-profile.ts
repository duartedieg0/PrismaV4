import { createServiceRoleClient } from "@/gateways/supabase/service-role";

type ProfileRecord = {
  id: string;
  full_name?: string | null;
  email: string | null;
  role: "teacher" | "admin";
  blocked: boolean;
  profile_completed: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = { from: (...args: any[]) => any; auth: { getUser: () => any } };

type GetProfileOrRedirectOptions = {
  createClient: () => Promise<SupabaseLike>;
};

async function readProfileWithFallback(
  createClient: GetProfileOrRedirectOptions["createClient"],
  userId: string,
) {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, blocked, profile_completed")
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
    .select("id, full_name, email, role, blocked, profile_completed")
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
