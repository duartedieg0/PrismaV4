"use client";

import { DataTableWrapper } from "@/design-system/components/data-table-wrapper";
import { EmptyState } from "@/design-system/components/empty-state";
import type { AdminUsageExam } from "@/features/admin/usage/contracts";

type UsageExamsTableProps = {
  exams: AdminUsageExam[];
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

export function UsageExamsTable({ exams }: UsageExamsTableProps) {
  if (exams.length === 0) {
    return <EmptyState message="Nenhuma prova com uso registrado." />;
  }

  return (
    <div className="rounded-2xl border border-border-default bg-white p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <strong className="text-sm font-semibold text-text-primary">
            Provas
          </strong>
          <span className="font-mono text-xs text-text-secondary">
            {exams.length} provas
          </span>
        </div>
        <DataTableWrapper>
          <table>
            <thead>
              <tr>
                <th align="left">Tópico</th>
                <th align="left">Status</th>
                <th align="right">Extração (USD)</th>
                <th align="right">Adaptação (USD)</th>
                <th align="right">Total (USD)</th>
                <th align="left">Criada em</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.examId}>
                  <td>{exam.topic ?? "—"}</td>
                  <td className="text-sm text-text-secondary">{exam.status}</td>
                  <td align="right" className="font-mono text-sm">
                    ${exam.extractionCostUSD.toFixed(4)}
                  </td>
                  <td align="right" className="font-mono text-sm">
                    ${exam.adaptationCostUSD.toFixed(4)}
                  </td>
                  <td align="right" className="font-mono text-sm">
                    ${exam.totalCostUSD.toFixed(4)}
                  </td>
                  <td className="text-sm text-text-secondary">
                    {formatDate(exam.createdAt)}
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
