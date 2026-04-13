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
    <div className="rounded-2xl border border-border-default bg-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-default px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <strong className="text-sm font-semibold text-text-primary">Sessões</strong>
          <span className="text-xs text-text-muted">Uso de tokens por conversa com o consultor.</span>
        </div>
        <span className="rounded-full bg-surface-muted px-2.5 py-1 font-mono text-xs text-text-secondary">
          {threads.length} sessões
        </span>
      </div>

      <DataTableWrapper>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default bg-surface-muted/50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                Título
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                Input
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                Output
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                Cache lido
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                Cache criado
              </th>
              <th className="bg-brand-50 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-700">
                Custo (USD)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                Última atividade
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {threads.map((thread) => (
              <tr key={thread.threadId} className="transition-colors hover:bg-surface-muted/40">
                <td className="max-w-xs px-5 py-3.5">
                  <span className="block truncate font-medium text-text-primary">
                    {thread.title ?? <span className="text-text-muted italic">Sem título</span>}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums text-text-secondary">
                  {thread.inputTokens.toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums text-text-secondary">
                  {thread.outputTokens.toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums text-text-muted">
                  {thread.cacheReadTokens.toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums text-text-muted">
                  {thread.cacheCreationTokens.toLocaleString("pt-BR")}
                </td>
                <td className="bg-brand-50/50 px-4 py-3.5 text-right font-mono text-sm font-semibold text-brand-700">
                  ${thread.estimatedCostUSD.toFixed(4)}
                </td>
                <td className="px-4 py-3.5 text-right text-xs text-text-muted">
                  {formatDate(thread.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableWrapper>
    </div>
  );
}
