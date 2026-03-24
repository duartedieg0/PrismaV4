import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleAccessControl } from "@/features/access-control/assert-access";
import {
  checkRateLimit,
  resolveRateLimitGroup,
  getRateLimitRule,
} from "@/lib/rate-limit";
import { recordApiLatency, recordApiError } from "@/lib/metrics";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function proxy(request: NextRequest) {
  const start = Date.now();
  const ip = getClientIp(request);
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  const group = resolveRateLimitGroup(pathname, method);
  const rule = getRateLimitRule(group);

  const rateLimitResult = checkRateLimit(`${ip}:${group}`, rule);

  if (!rateLimitResult.allowed) {
    recordApiError(pathname, method, 429);
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em breve." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitResult.retryAfterSeconds),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  const response = await handleAccessControl(request);
  const result = response ?? NextResponse.next();
  const status = result.status ?? 200;
  const durationMs = Date.now() - start;

  if (pathname.startsWith("/api/")) {
    recordApiLatency(pathname, method, status, durationMs);
    if (status >= 400) {
      recordApiError(pathname, method, status);
    }
  }

  return result;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
