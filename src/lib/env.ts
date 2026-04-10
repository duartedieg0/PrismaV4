import { z } from "zod";

const serverEnvSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z
      .string()
      .url("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL valida"),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
      .string()
      .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY e obrigatoria"),
    SUPABASE_SECRET_API_KEY: z
      .string()
      .min(1, "SUPABASE_SECRET_API_KEY e obrigatoria"),
    SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    MASTRA_LOG_LEVEL: z
      .enum(["debug", "info", "warn", "error", "silent"])
      .default("info"),
    // Managed Agents — opcionais individualmente, mas condicionalmente obrigatórias como grupo
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    MANAGED_AGENT_ID: z.string().min(1).optional(),
    MANAGED_AGENT_ENVIRONMENT_ID: z.string().min(1).optional(),
    MANAGED_AGENT_MEMORY_STORE_ID: z.string().min(1).optional(),
    // Feature flag do backend do Consultor TEA
    CONSULTANT_BACKEND: z.enum(["mastra", "managed"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.MANAGED_AGENT_ID) return;

    const required: [keyof typeof data, string | undefined][] = [
      ["ANTHROPIC_API_KEY", data.ANTHROPIC_API_KEY],
      ["MANAGED_AGENT_ENVIRONMENT_ID", data.MANAGED_AGENT_ENVIRONMENT_ID],
    ];

    for (const [key, value] of required) {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} e obrigatoria quando MANAGED_AGENT_ID esta presente`,
          path: [key],
        });
      }
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let _env: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (_env) {
    return _env;
  }

  const input = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const result = serverEnvSchema.safeParse(input);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    console.error(
      "Variaveis de ambiente invalidas:",
      JSON.stringify(formatted, null, 2),
    );
    throw new Error("Falha na validacao de variaveis de ambiente");
  }

  _env = result.data;
  return _env;
}

export function resetEnvCache() {
  _env = null;
}
