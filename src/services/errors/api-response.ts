import { NextResponse } from "next/server";
import type { ZodError } from "zod";

type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: Record<string, string[]>,
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

export function apiValidationError(zodError: ZodError) {
  return apiError(
    "VALIDATION_ERROR",
    "Dados inválidos.",
    400,
    zodError.flatten().fieldErrors as Record<string, string[]>,
  );
}

export function apiNotFound(message = "Recurso não encontrado.") {
  return apiError("NOT_FOUND", message, 404);
}

export function apiUnauthorized(message = "Não autenticado.") {
  return apiError("UNAUTHORIZED", message, 401);
}

export function apiForbidden(message = "Acesso negado.") {
  return apiError("FORBIDDEN", message, 403);
}

export function apiConflict(message: string) {
  return apiError("CONFLICT", message, 409);
}

export function apiInternalError(message = "Erro interno.") {
  return apiError("INTERNAL_ERROR", message, 500);
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}
