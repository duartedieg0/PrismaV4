"use client";

import Link from "next/link";
import { DataTableWrapper } from "@/design-system/components/data-table-wrapper";
import { EmptyState } from "@/design-system/components/empty-state";
import type { AdminUsageUser } from "@/features/admin/usage/contracts";

type UsageUsersTableProps = {
  users: AdminUsageUser[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function UsageUsersTable({ users }: UsageUsersTableProps) {
  if (users.length === 0) {
    return <EmptyState message="Nenhuma sessão registrada ainda." />;
  }

  return (
    <div className="rounded-2xl border border-border-default bg-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-default px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <strong className="text-sm font-semibold text-text-primary">Uso por professor</strong>
          <span className="text-xs text-text-muted">
            Clique em um professor para ver o detalhamento por conversa.
          </span>
        </div>
        <span className="rounded-full bg-surface-muted px-2.5 py-1 font-mono text-xs text-text-secondary">
          {users.length} professores
        </span>
      </div>

      <DataTableWrapper>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default bg-surface-muted/50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                Professor
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                Sessões
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                Provas
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                Consultant
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                Extração
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                Adaptação
              </th>
              <th className="bg-brand-50 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-700">
                Total (USD)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                Últ. atividade
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {users.map((user) => (
              <tr key={user.userId} className="group transition-colors hover:bg-surface-muted/40">
                <td className="px-5 py-3.5">
                  <div className="flex flex-col gap-0.5">
                    <Link
                      href={`/usage/${user.userId}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {user.name ?? "—"}
                    </Link>
                    <span className="text-xs text-text-muted">{user.email ?? ""}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-text-secondary">
                  {user.threadCount}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-text-secondary">
                  {user.examCount}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs text-text-secondary">
                  ${user.costByCategory.consultant.toFixed(4)}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs text-text-secondary">
                  ${user.costByCategory.extraction.toFixed(4)}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs text-text-secondary">
                  ${user.costByCategory.adaptation.toFixed(4)}
                </td>
                <td className="bg-brand-50/50 px-4 py-3.5 text-right font-mono text-sm font-semibold text-brand-700">
                  ${user.estimatedCostUSD.toFixed(4)}
                </td>
                <td className="px-4 py-3.5 text-right text-xs text-text-muted">
                  {user.lastActivityAt ? formatDate(user.lastActivityAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableWrapper>
    </div>
  );
}
