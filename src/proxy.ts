import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleAccessControl } from "@/features/access-control/assert-access";

export async function proxy(request: NextRequest) {
  const response = await handleAccessControl(request);
  return response ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
