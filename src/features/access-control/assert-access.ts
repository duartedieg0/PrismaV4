import { NextResponse, type NextRequest } from "next/server";
import { resolveAccessDecision } from "@/features/access-control/access-policy";
import { createClient as createServerClient } from "@/gateways/supabase/server";
import { hasAuthSession } from "@/gateways/supabase/middleware";
import { getAuthenticatedUser } from "@/features/auth/get-authenticated-user";
import { getProfileOrRedirect } from "@/features/auth/get-profile";
import { hasSupabaseCredentials } from "@/gateways/supabase/environment";

type AuthenticatedResult =
  | { kind: "anonymous" }
  | { kind: "expired"; reason: string }
  | { kind: "authenticated"; user: { id: string; email: string | null } };

type ProfileResult =
  | {
      kind: "redirect";
      redirectTo: string;
      reason: "missing_session" | "missing_profile";
      message: string;
    }
  | {
      kind: "profile";
      profile: {
        id: string;
        email: string | null;
        role: "teacher" | "admin";
        blocked: boolean;
      };
    };

type HandleAccessControlDependencies = {
  resolveAuthenticatedUser?: () => Promise<AuthenticatedResult>;
  resolveProfile?: () => Promise<ProfileResult>;
};

async function resolveAuthenticatedUserFromGateway(): Promise<AuthenticatedResult> {
  if (!hasSupabaseCredentials()) {
    return {
      kind: "anonymous",
    };
  }

  return getAuthenticatedUser({
    createClient: async () => createServerClient() as any,
  });
}

async function resolveProfileFromGateway(): Promise<ProfileResult> {
  if (!hasSupabaseCredentials()) {
    return {
      kind: "redirect",
      redirectTo: "/login",
      reason: "missing_session",
      message: "Voce precisa entrar para continuar.",
    };
  }

  return getProfileOrRedirect({
    createClient: async () => createServerClient() as any,
  });
}

function redirect(request: NextRequest, destination: string) {
  return NextResponse.redirect(new URL(destination, request.url));
}

export async function handleAccessControl(
  request: NextRequest,
  dependencies: HandleAccessControlDependencies = {},
) {
  if (!hasAuthSession(request)) {
    const decision = resolveAccessDecision({
      route: request.nextUrl.pathname,
      sessionUser: null,
      profile: null,
    });

    return decision.allow ? null : redirect(request, decision.redirectTo ?? "/login");
  }

  const resolveAuthenticatedUser =
    dependencies.resolveAuthenticatedUser ?? resolveAuthenticatedUserFromGateway;

  const resolveProfile =
    dependencies.resolveProfile ?? resolveProfileFromGateway;

  const authResult = await resolveAuthenticatedUser();

  if (authResult.kind === "expired") {
    return redirect(request, "/login?error=expired_session");
  }

  if (authResult.kind === "anonymous") {
    const decision = resolveAccessDecision({
      route: request.nextUrl.pathname,
      sessionUser: null,
      profile: null,
    });

    return decision.allow ? null : redirect(request, decision.redirectTo ?? "/login");
  }

  const profileResult = await resolveProfile();

  if (profileResult.kind === "redirect") {
    const decision = resolveAccessDecision({
      route: request.nextUrl.pathname,
      sessionUser: authResult.user,
      profile: null,
    });

    return decision.allow ? null : redirect(request, decision.redirectTo ?? profileResult.redirectTo);
  }

  const decision = resolveAccessDecision({
    route: request.nextUrl.pathname,
    sessionUser: authResult.user,
    profile: profileResult.profile,
  });

  return decision.allow ? null : redirect(request, decision.redirectTo ?? "/login");
}
