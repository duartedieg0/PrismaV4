"use client";

import { DataTableWrapper } from "@/design-system/components/data-table-wrapper";
import { EmptyState } from "@/design-system/components/empty-state";
import type { AdminUsageThread } from "@/features/admin/usage/contracts";

type UsageThreadsTableProps = {
  threads: AdminUsageThread[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UsageThreadsTable({ threads }: UsageThreadsTableProps) {
  if (threads.length === 0) {
    return <EmptyState message="Nenhuma conversa com uso registrado." />;
  }

  return (
    <div className="rounded-2xl border border-border-default bg-white p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <strong className="text-sm font-semibold text-text-primary">
            Conversas
          </strong>
          <span className="font-mono text-xs text-text-secondary">
            {threads.length} conversas
          </span>
        </div>
        <DataTableWrapper>
          <table>
            <thead>
              <tr>
                <th align="left">Título</th>
                <th align="right">Input</th>
                <th align="right">Output</th>
                <th align="right">Cache read</th>
                <th align="right">Cache creation</th>
                <th align="right">Custo (USD)</th>
                <th align="left">Última atividade</th>
              </tr>
            </thead>
            <tbody>
              {threads.map((thread) => (
                <tr key={thread.threadId}>
                  <td>{thread.title ?? "—"}</td>
                  <td align="right" className="font-mono text-sm">
                    {thread.inputTokens.toLocaleString("pt-BR")}
                  </td>
                  <td align="right" className="font-mono text-sm">
                    {thread.outputTokens.toLocaleString("pt-BR")}
                  </td>
                  <td align="right" className="font-mono text-sm">
                    {thread.cacheReadTokens.toLocaleString("pt-BR")}
                  </td>
                  <td align="right" className="font-mono text-sm">
                    {thread.cacheCreationTokens.toLocaleString("pt-BR")}
                  </td>
                  <td align="right" className="font-mono text-sm">
                    ${thread.estimatedCostUSD.toFixed(4)}
                  </td>
                  <td className="text-sm text-text-secondary">
                    {formatDate(thread.updatedAt)}
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
