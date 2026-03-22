import { NextResponse } from "next/server";
import { getProfileOrRedirect } from "@/features/auth/get-profile";
import { createClient } from "@/gateways/supabase/server";
import type { AdminRouteAccess } from "@/features/admin/shared/contracts";

export async function requireAdminPageAccess() {
  const supabase = await createClient();
  const profileResult = await getProfileOrRedirect({
    createClient: async () => supabase as never,
  });

  if (profileResult.kind === "redirect") {
    return profileResult;
  }

  if (profileResult.profile.blocked) {
    return {
      kind: "redirect" as const,
      redirectTo: "/blocked",
      reason: "blocked" as const,
      message: "Sua conta está bloqueada.",
    };
  }

  if (profileResult.profile.role !== "admin") {
    return {
      kind: "redirect" as const,
      redirectTo: "/dashboard",
      reason: "forbidden" as const,
      message: "Acesso administrativo necessário.",
    };
  }

  return profileResult;
}

export async function requireAdminRouteAccess(): Promise<AdminRouteAccess> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      kind: "error",
      response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }),
    };
  }

  const profileResult = await getProfileOrRedirect({
    createClient: async () => supabase as never,
  });

  if (profileResult.kind === "redirect") {
    return {
      kind: "error",
      response: NextResponse.json({ error: "Acesso negado." }, { status: 403 }),
    };
  }

  if (profileResult.profile.blocked || profileResult.profile.role !== "admin") {
    return {
      kind: "error",
      response: NextResponse.json({ error: "Acesso negado." }, { status: 403 }),
    };
  }

  return {
    kind: "ok",
    userId: user.id,
    role: "admin",
  };
}
