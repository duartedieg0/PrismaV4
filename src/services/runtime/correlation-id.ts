import * as nodeCrypto from "node:crypto";

const SAFE_CORRELATION_ID_PATTERN = /^[A-Za-z0-9:_-]{1,64}$/;

export function createCorrelationId(): string {
  return nodeCrypto.randomUUID();
}

export function normalizeCorrelationId(
  correlationId: string | null | undefined,
): string {
  const normalized = correlationId?.trim();

  if (normalized && SAFE_CORRELATION_ID_PATTERN.test(normalized)) {
    return normalized;
  }

  return createCorrelationId();
}
