import { NextResponse } from "next/server";
import { hasSupabaseCredentials } from "@/gateways/supabase/environment";
import { createClient } from "@/gateways/supabase/server";

export async function GET() {
  const checks = {
    supabaseCredentials: hasSupabaseCredentials(),
    supabaseConnection: false,
  };

  if (checks.supabaseCredentials) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("subjects").select("id").limit(1);
      checks.supabaseConnection = !error;
    } catch {
      checks.supabaseConnection = false;
    }
  }

  const ready = Object.values(checks).every(Boolean);

  return NextResponse.json(
    { status: ready ? "ready" : "not_ready", checks },
    { status: ready ? 200 : 503 },
  );
}
