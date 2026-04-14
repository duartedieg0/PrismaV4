import { StatCard } from "@/design-system/components/stat-card";
import { FileText, HelpCircle, MessageSquare } from "lucide-react";

type DashboardHeaderProps = Readonly<{
  teacherName: string;
  stats: {
    total: number;
    questions: number;
    feedbacks: number;
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
          label="Total de questões"
          value={stats.questions}
          icon={<HelpCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Total de feedbacks"
          value={stats.feedbacks}
          icon={<MessageSquare className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
