"use client";

import Link from "next/link";
import { DataTableWrapper } from "@/design-system/components/data-table-wrapper";
import { EmptyState } from "@/design-system/components/empty-state";
import type { AdminUsageUser } from "@/features/admin/usage/contracts";

type UsageUsersTableProps = {
  users: AdminUsageUser[];
};

export function UsageUsersTable({ users }: UsageUsersTableProps) {
  if (users.length === 0) {
    return <EmptyState message="Nenhuma sessão registrada ainda." />;
  }

  return (
    <div className="rounded-2xl border border-border-default bg-white p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <strong className="text-sm font-semibold text-text-primary">
              Uso por professor
            </strong>
            <span className="text-sm text-text-secondary">
              Clique em um professor para ver o detalhamento por conversa.
            </span>
          </div>
          <span className="font-mono text-xs text-text-secondary">
            {users.length} professores
          </span>
        </div>
        <DataTableWrapper>
          <table>
            <thead>
              <tr>
                <th align="left">Professor</th>
                <th align="left">E-mail</th>
                <th align="right">Conversas</th>
                <th align="right">Custo estimado (USD)</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId}>
                  <td>
                    <Link
                      href={`/usage/${user.userId}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {user.name ?? "—"}
                    </Link>
                  </td>
                  <td>{user.email ?? "—"}</td>
                  <td align="right">{user.threadCount}</td>
                  <td align="right" className="font-mono text-sm">
                    ${user.estimatedCostUSD.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableWrapper>
      </div>
    </div>
  );
}
