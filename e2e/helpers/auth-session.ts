import { loadEnvConfig } from "@next/env";
import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { BrowserContext } from "@playwright/test";

loadEnvConfig(process.cwd());

type AuthenticatedSessionOptions = {
  context: BrowserContext;
  baseURL: string;
};

export function hasAuthenticatedE2ECredentials() {
  return Boolean(
    process.env.E2E_SUPABASE_TEST_EMAIL && process.env.E2E_SUPABASE_TEST_PASSWORD,
  );
}

function getPublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function createServiceRoleClient() {
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

async function ensureE2ECatalog() {
  const serviceRoleClient = createServiceRoleClient();

  if (!serviceRoleClient) {
    return true;
  }

  const { data: existingModel, error: modelReadError } = await serviceRoleClient
    .from("ai_models")
    .select("id")
    .eq("enabled", true)
    .limit(1)
    .maybeSingle();

  if (modelReadError) {
    return false;
  }

  let modelId = existingModel?.id ?? null;

  if (!modelId) {
    const { data: createdModel, error: createModelError } = await serviceRoleClient
      .from("ai_models")
      .insert({
        name: "E2E Default Model",
        provider: "openai",
        base_url: "https://api.openai.com/v1",
        api_key: "e2e-secret-key",
        model_id: "gpt-5.4-mini",
        enabled: true,
        is_default: true,
        system_role: "adaptation",
      })
      .select("id")
      .single();

    if (createModelError || !createdModel?.id) {
      return false;
    }

    modelId = createdModel.id;
  }

  const { data: existingAgent, error: agentReadError } = await serviceRoleClient
    .from("agents")
    .select("id")
    .eq("enabled", true)
    .limit(1)
    .maybeSingle();

  if (agentReadError) {
    return false;
  }

  let agentId = existingAgent?.id ?? null;

  if (!agentId) {
    const { data: createdAgent, error: createAgentError } = await serviceRoleClient
      .from("agents")
      .insert({
        name: "E2E Adaptation Agent",
        prompt: "Adapte a questão com clareza, linguagem simples e preservação pedagógica.",
        objective: "Garantir baseline de testes E2E autenticados.",
        version: 1,
        enabled: true,
      })
      .select("id")
      .single();

    if (createAgentError || !createdAgent?.id) {
      return false;
    }

    agentId = createdAgent.id;
  }

  const { data: existingSupport, error: supportReadError } = await serviceRoleClient
    .from("supports")
    .select("id")
    .eq("enabled", true)
    .limit(1)
    .maybeSingle();

  if (supportReadError) {
    return false;
  }

  if (!existingSupport?.id) {
    const { error: createSupportError } = await serviceRoleClient
      .from("supports")
      .insert({
        name: "E2E Support",
        agent_id: agentId,
        model_id: modelId,
        enabled: true,
      });

    if (createSupportError) {
      return false;
    }
  }

  return true;
}

async function ensureTeacherProfile(user: {
  id: string;
  email: string | null;
}, browserClient: ReturnType<typeof createBrowserClient>) {
  const existingProfile = await browserClient
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile.data?.id) {
    return true;
  }

  if (existingProfile.error) {
    return true;
  }

  const serviceRoleClient = createServiceRoleClient();

  if (!serviceRoleClient) {
    return true;
  }

  const { error } = await serviceRoleClient.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: "Professor E2E",
      role: "teacher",
      blocked: false,
    },
    {
      onConflict: "id",
    },
  );

  return !error;
}

export async function seedAuthenticatedTeacherContext({
  context,
  baseURL,
}: AuthenticatedSessionOptions): Promise<{
  authenticated: boolean;
}> {
  const publishableKey = getPublishableKey();

  if (
    !hasAuthenticatedE2ECredentials() ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !publishableKey
  ) {
    return {
      authenticated: false,
    };
  }

  const cookiesToSet: Array<{
    name: string;
    value: string;
    options?: {
      domain?: string;
      path?: string;
      expires?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "lax" | "strict" | "none";
    };
  }> = [];

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey,
    {
      cookies: {
        getAll() {
          return cookiesToSet.map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(nextCookies) {
          cookiesToSet.splice(
            0,
            cookiesToSet.length,
            ...nextCookies.map((cookie) => ({
              name: cookie.name,
              value: cookie.value,
              options: cookie.options,
            })),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.E2E_SUPABASE_TEST_EMAIL!,
    password: process.env.E2E_SUPABASE_TEST_PASSWORD!,
  });

  if (error || !data.user) {
    return {
      authenticated: false,
    };
  }

  const profileEnsured = await ensureTeacherProfile(
    {
      id: data.user.id,
      email: data.user.email ?? null,
    },
    supabase,
  );

  if (!profileEnsured) {
    return {
      authenticated: false,
    };
  }

  const catalogEnsured = await ensureE2ECatalog();

  if (!catalogEnsured) {
    return {
      authenticated: false,
    };
  }

  await context.addCookies(
    cookiesToSet.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      url: baseURL,
      expires: cookie.options?.expires,
      httpOnly: cookie.options?.httpOnly ?? false,
      secure: cookie.options?.secure ?? false,
      sameSite: cookie.options?.sameSite === "strict"
        ? "Strict"
        : cookie.options?.sameSite === "none"
          ? "None"
          : "Lax",
    })),
  );

  return {
    authenticated: true,
  };
}

export async function seedAuthenticatedSession({
  context,
  baseURL,
}: AuthenticatedSessionOptions) {
  const result = await seedAuthenticatedTeacherContext({
    context,
    baseURL,
  });

  return result.authenticated;
}

export async function createAuthenticatedTestClient() {
  const publishableKey = getPublishableKey();

  if (
    !hasAuthenticatedE2ECredentials() ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !publishableKey
  ) {
    return null;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.E2E_SUPABASE_TEST_EMAIL!,
    password: process.env.E2E_SUPABASE_TEST_PASSWORD!,
  });

  if (error || !data.user) {
    return null;
  }

  return {
    supabase,
    user: data.user,
  };
}
