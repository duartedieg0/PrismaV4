import { NextResponse } from "next/server";
import { exchangeCodeAndResolveRedirect } from "@/features/auth/callback";

export async function GET(request: Request) {
  const destination = await exchangeCodeAndResolveRedirect(request.url);
  return NextResponse.redirect(destination);
}
