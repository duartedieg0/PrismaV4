import { createClient as createServerClient } from "@/gateways/supabase/server";
import { hasSupabaseCredentials } from "@/gateways/supabase/environment";
import { getProfileOrRedirect } from "@/features/auth/get-profile";

export function buildCallbackRedirect(options: {
  origin: string;
  error: "no_code" | "auth_failed";
}) {
  return `${options.origin}/login?error=${options.error}`;
}

export function resolveCallbackRedirect(options: {
  origin: string;
  next: string;
  role: "teacher" | "admin";
  blocked: boolean;
}) {
  if (options.blocked) {
    return `${options.origin}/blocked`;
  }

  if (options.role === "admin") {
    return `${options.origin}/config`;
  }

  return `${options.origin}${options.next}`;
}

export async function exchangeCodeAndResolveRedirect(requestUrl: string) {
  const { origin, searchParams } = new URL(requestUrl);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return buildCallbackRedirect({
      origin,
      error: "no_code",
    });
  }

  if (!hasSupabaseCredentials()) {
    return buildCallbackRedirect({
      origin,
      error: "auth_failed",
    });
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return buildCallbackRedirect({
      origin,
      error: "auth_failed",
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildCallbackRedirect({
      origin,
      error: "auth_failed",
    });
  }

  const profileResult = await getProfileOrRedirect({
    createClient: async () => supabase as any,
  });

  if (profileResult.kind === "redirect") {
    return `${origin}${profileResult.redirectTo}`;
  }

  return resolveCallbackRedirect({
    origin,
    next,
    role: profileResult.profile.role,
    blocked: profileResult.profile.blocked,
  });
}
