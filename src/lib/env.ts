import { z } from "zod";

const serverEnvSchema = z.object({
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
