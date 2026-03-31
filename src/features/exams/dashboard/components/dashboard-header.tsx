import { StatCard } from "@/design-system/components/stat-card";
import { FileText, Loader, CheckCircle } from "lucide-react";

type DashboardHeaderProps = Readonly<{
  teacherName: string;
  stats: {
    total: number;
    processing: number;
    completed: number;
  };
}>;

export function DashboardHeader({ teacherName, stats }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Olá, {teacherName}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total de provas"
          value={stats.total}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          label="Em processamento"
          value={stats.processing}
          icon={<Loader className="h-5 w-5" />}
        />
        <StatCard
          label="Concluídas"
          value={stats.completed}
          trend={stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : undefined}
          icon={<CheckCircle className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
