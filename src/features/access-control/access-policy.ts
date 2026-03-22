import type { Profile } from "@/domains";
import {
  createAccessDecision,
  type AccessDecision,
} from "@/features/access-control/contracts";

type SessionUser = {
  id: string;
  email: string | null;
};

type ResolveAccessDecisionInput = {
  route: string;
  sessionUser: SessionUser | null;
  profile: Pick<Profile, "id" | "email" | "role" | "blocked"> | null;
};

const PUBLIC_ROUTES = ["/", "/login", "/blocked", "/logout", "/login/callback"];
const ADMIN_ROUTES = ["/config", "/users", "/api/admin"];

function isPublicRoute(route: string) {
  return PUBLIC_ROUTES.some((publicRoute) =>
    publicRoute === "/" ? route === "/" : route.startsWith(publicRoute),
  );
}

function isAdminRoute(route: string) {
  return ADMIN_ROUTES.some((adminRoute) => route.startsWith(adminRoute));
}

export function resolveAccessDecision({
  route,
  sessionUser,
  profile,
}: ResolveAccessDecisionInput): AccessDecision {
  if (profile?.blocked) {
    return createAccessDecision({
      level: "blocked",
      allow: false,
      redirectTo: "/blocked",
      reason: "blocked_user",
      message: "Seu acesso esta bloqueado.",
    });
  }

  if (!sessionUser && !isPublicRoute(route)) {
    return createAccessDecision({
      level: isAdminRoute(route) ? "admin" : "teacher",
      allow: false,
      redirectTo: "/login",
      reason: "missing_session",
      message: "Voce precisa entrar para continuar.",
    });
  }

  if (sessionUser && !profile && route.startsWith("/login")) {
    return createAccessDecision({
      level: "public",
      allow: true,
    });
  }

  if (sessionUser && !profile && !isPublicRoute(route)) {
    return createAccessDecision({
      level: isAdminRoute(route) ? "admin" : "teacher",
      allow: false,
      redirectTo: "/login?error=missing_profile",
      reason: "missing_profile",
      message: "Perfil de acesso nao encontrado.",
    });
  }

  if (isPublicRoute(route) && sessionUser && route !== "/blocked") {
    return createAccessDecision({
      level: "public",
      allow: false,
      redirectTo: "/dashboard",
      reason: "authenticated_redirect",
      message: "Voce ja esta autenticado.",
    });
  }

  if (isAdminRoute(route) && profile?.role !== "admin") {
    return createAccessDecision({
      level: "admin",
      allow: false,
      redirectTo: "/dashboard",
      reason: "role_mismatch",
      message: "Voce nao tem permissao para acessar esta area.",
    });
  }

  return createAccessDecision({
    level: isAdminRoute(route)
      ? "admin"
      : isPublicRoute(route)
        ? "public"
        : "teacher",
    allow: true,
  });
}
