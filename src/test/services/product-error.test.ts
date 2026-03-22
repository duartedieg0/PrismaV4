import { describe, expect, it } from "vitest";
import { createProductError, toPublicError } from "@/services/errors/product-error";

describe("product errors", () => {
  it("creates typed product errors with safe user-facing metadata", () => {
    const error = createProductError({
      category: "integration",
      code: "SUPABASE_TIMEOUT",
      message: "Supabase query timed out after 5s",
      safeMessage: "Nao foi possivel concluir a operacao agora.",
      source: "database",
      stage: "processing",
      details: {
        table: "exams",
      },
    });

    expect(error).toMatchObject({
      category: "integration",
      code: "SUPABASE_TIMEOUT",
      message: "Supabase query timed out after 5s",
      safeMessage: "Nao foi possivel concluir a operacao agora.",
      source: "database",
      stage: "processing",
      details: {
        table: "exams",
      },
    });
  });

  it("exposes only the safe message in the public error view", () => {
    const error = createProductError({
      category: "validation",
      code: "INVALID_FILE",
      message: "PDF checksum invalid",
      safeMessage: "O arquivo enviado nao e valido.",
      source: "client",
      stage: "validation",
    });

    expect(toPublicError(error)).toEqual({
      code: "INVALID_FILE",
      message: "O arquivo enviado nao e valido.",
    });
  });
});
