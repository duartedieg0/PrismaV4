import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  apiError,
  apiValidationError,
  apiNotFound,
  apiUnauthorized,
  apiForbidden,
  apiConflict,
  apiInternalError,
  apiSuccess,
} from "@/services/errors/api-response";

describe("apiError", () => {
  it("returns structured error with code and message", async () => {
    const response = apiError("NOT_FOUND", "Exame não encontrado.", 404);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: { code: "NOT_FOUND", message: "Exame não encontrado." },
    });
  });

  it("includes details when provided", async () => {
    const response = apiError("VALIDATION_ERROR", "Dados inválidos.", 400, {
      name: ["Campo obrigatório"],
    });

    const body = await response.json();
    expect(body.error.details).toEqual({ name: ["Campo obrigatório"] });
  });
});

describe("apiValidationError", () => {
  it("flattens Zod errors into details", async () => {
    const schema = z.object({ name: z.string().min(1) });
    const result = schema.safeParse({ name: "" });

    if (result.success) throw new Error("expected failure");

    const response = apiValidationError(result.error);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details.name).toBeDefined();
  });
});

describe("convenience helpers", () => {
  it("apiNotFound returns 404", async () => {
    const response = apiNotFound("Agente não encontrado.");
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("Agente não encontrado.");
  });

  it("apiUnauthorized returns 401 with default message", async () => {
    const response = apiUnauthorized();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("apiForbidden returns 403", async () => {
    const response = apiForbidden();
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("apiConflict returns 409", async () => {
    const response = apiConflict("Recurso em uso.");
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error.code).toBe("CONFLICT");
  });

  it("apiInternalError returns 500 with default message", async () => {
    const response = apiInternalError();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("apiSuccess", () => {
  it("wraps data in envelope with default 200", async () => {
    const response = apiSuccess({ id: "1", name: "Teste" });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { id: "1", name: "Teste" },
    });
  });

  it("accepts custom status code", async () => {
    const response = apiSuccess({ id: "1" }, 201);
    expect(response.status).toBe(201);
  });
});
