import { redirect } from "next/navigation";
import { requireAdminPageAccess } from "@/features/admin/shared/admin-guard";
import { createClient } from "@/gateways/supabase/server";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { UsageThreadsTable } from "@/features/admin/usage/components/usage-threads-table";
import type { AdminUsageThread } from "@/features/admin/usage/contracts";

async function loadUserUsage(userId: string) {
  const supabase = await createClient();

  const [profileResult, threadsResult] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", userId).single(),
    supabase
      .from("consultant_threads")
      .select(
        "id, title, total_input_tokens, total_output_tokens, total_cache_read_tokens, total_cache_creation_tokens, estimated_cost_usd, updated_at",
      )
      .eq("teacher_id", userId)
      .not("managed_session_id", "is", null)
      .order("updated_at", { ascending: false }),
  ]);

  const profile = profileResult.data as { full_name: string | null; email: string | null } | null;
  const rawThreads = threadsResult.data ?? [];

  const threads: AdminUsageThread[] = rawThreads.map((t) => ({
    threadId: t.id as string,
    title: t.title as string | null,
    inputTokens: (t.total_input_tokens as number) ?? 0,
    outputTokens: (t.total_output_tokens as number) ?? 0,
    cacheReadTokens: (t.total_cache_read_tokens as number) ?? 0,
    cacheCreationTokens: (t.total_cache_creation_tokens as number) ?? 0,
    estimatedCostUSD: (t.estimated_cost_usd as number) ?? 0,
    updatedAt: t.updated_at as string,
  }));

  return { profile, threads };
}

type PageProps = { params: Promise<{ userId: string }> };

export default async function AdminUsageUserPage({ params }: PageProps) {
  const access = await requireAdminPageAccess();
  if (access.kind === "redirect") redirect(access.redirectTo);

  const { userId } = await params;
  const { profile, threads } = await loadUserUsage(userId);

  const name = profile?.full_name ?? "Professor";
  const email = profile?.email ?? "";

  return (
    <AdminShell
      title={name}
      description={email}
      activeNav="usage"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Usage", href: "/usage" },
        { label: name, href: `/usage/${userId}` },
      ]}
    >
      <UsageThreadsTable threads={threads} />
    </AdminShell>
  );
}
