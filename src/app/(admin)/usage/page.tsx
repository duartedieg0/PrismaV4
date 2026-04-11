import { redirect } from "next/navigation";
import { requireAdminPageAccess } from "@/features/admin/shared/admin-guard";
import { createClient } from "@/gateways/supabase/server";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { UsageUsersTable } from "@/features/admin/usage/components/usage-users-table";
import type { AdminUsageSummary, AdminUsageUser } from "@/features/admin/usage/contracts";

async function loadUsageSummary(): Promise<AdminUsageSummary> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("consultant_threads")
    .select("teacher_id, estimated_cost_usd, updated_at, profiles(full_name, email)")
    .not("managed_session_id", "is", null);

  if (error || !data) {
    return { totals: { sessions: 0, estimatedCostUSD: 0 }, users: [] };
  }

  const userMap = new Map<string, AdminUsageUser>();
  for (const thread of data) {
    const profile = thread.profiles as unknown as { full_name: string | null; email: string | null } | null;
    const cost = (thread.estimated_cost_usd as number) ?? 0;
    const updatedAt = thread.updated_at as string;
    if (!userMap.has(thread.teacher_id)) {
      userMap.set(thread.teacher_id, {
        userId: thread.teacher_id,
        name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        threadCount: 0,
        estimatedCostUSD: 0,
        lastActivityAt: updatedAt,
      });
    }
    const user = userMap.get(thread.teacher_id)!;
    user.threadCount++;
    user.estimatedCostUSD += cost;
    if (updatedAt > (user.lastActivityAt ?? "")) user.lastActivityAt = updatedAt;
  }

  const users = [...userMap.values()].sort((a, b) => b.estimatedCostUSD - a.estimatedCostUSD);
  return {
    totals: {
      sessions: data.length,
      estimatedCostUSD: users.reduce((s, u) => s + u.estimatedCostUSD, 0),
    },
    users,
  };
}

export default async function AdminUsagePage() {
  const access = await requireAdminPageAccess();
  if (access.kind === "redirect") redirect(access.redirectTo);

  const summary = await loadUsageSummary();

  return (
    <AdminShell
      title="Usage"
      description="Rastreamento de tokens e custo estimado por professor e conversa."
      activeNav="usage"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Usage", href: "/usage" },
      ]}
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border-default bg-white p-5">
            <p className="text-sm text-text-secondary">Total de sessões</p>
            <p className="mt-1 text-2xl font-semibold text-text-primary">
              {summary.totals.sessions.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-2xl border border-border-default bg-white p-5">
            <p className="text-sm text-text-secondary">Custo estimado total</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-text-primary">
              ${summary.totals.estimatedCostUSD.toFixed(4)} USD
            </p>
          </div>
        </div>

        <UsageUsersTable users={summary.users} />
      </div>
    </AdminShell>
  );
}
