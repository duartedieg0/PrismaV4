"use client";

import { DataTableWrapper } from "@/design-system/components/data-table-wrapper";
import { EmptyState } from "@/design-system/components/empty-state";
import { Badge } from "@/design-system/components/badge";
import type { AdminUsageExam } from "@/features/admin/usage/contracts";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline" | "accent";

type UsageExamsTableProps = {
  exams: AdminUsageExam[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status) {
    case "ready":
      return { label: "Pronta", variant: "success" };
    case "processing":
      return { label: "Processando", variant: "warning" };
    case "draft":
      return { label: "Rascunho", variant: "outline" };
    case "error":
      return { label: "Erro", variant: "danger" };
    default:
      return { label: status, variant: "outline" };
  }
}

export function UsageExamsTable({ exams }: UsageExamsTableProps) {
  if (exams.length === 0) {
    return <EmptyState message="Nenhuma prova com uso registrado." />;
  }

  return (
    <div className="rounded-2xl border border-border-default bg-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-default px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <strong className="text-sm font-semibold text-text-primary">Provas</strong>
          <span className="text-xs text-text-muted">Custo de extração e adaptação por prova.</span>
        </div>
        <span className="rounded-full bg-surface-muted px-2.5 py-1 font-mono text-xs text-text-secondary">
          {exams.length} provas
        </span>
      </div>

      <DataTableWrapper>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default bg-surface-muted/50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                Tópico
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                Status
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
                Criada em
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {exams.map((exam) => {
              const { label, variant } = statusBadge(exam.status);
              return (
                <tr key={exam.examId} className="transition-colors hover:bg-surface-muted/40">
                  <td className="max-w-xs px-5 py-3.5">
                    <span className="block truncate font-medium text-text-primary">
                      {exam.topic ?? <span className="text-text-muted italic">Sem tópico</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={variant} size="sm">{label}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums text-text-secondary">
                    ${exam.extractionCostUSD.toFixed(4)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums text-text-secondary">
                    ${exam.adaptationCostUSD.toFixed(4)}
                  </td>
                  <td className="bg-brand-50/50 px-4 py-3.5 text-right font-mono text-sm font-semibold text-brand-700">
                    ${exam.totalCostUSD.toFixed(4)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-xs text-text-muted">
                    {formatDate(exam.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataTableWrapper>
    </div>
  );
}
