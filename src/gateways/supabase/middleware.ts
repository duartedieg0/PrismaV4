import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function hasAuthSession(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      ({ name, value }) =>
        /-auth-token(\.\d+)?$/.test(name) && value.trim().length > 0,
    );
}

export async function updateSession(request: NextRequest) {
  return hasAuthSession(request)
    ? NextResponse.next()
    : NextResponse.next({
        request,
      });
}
