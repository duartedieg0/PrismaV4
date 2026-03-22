import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/gateways/supabase/server";
import { hasSupabaseCredentials } from "@/gateways/supabase/environment";

export async function POST(request: Request) {
  if (hasSupabaseCredentials()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  for (const cookie of allCookies) {
    if (cookie.name.includes("-auth-token")) {
      cookieStore.delete(cookie.name);
    }
  }

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`, { status: 302 });
}
