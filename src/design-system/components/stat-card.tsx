import { cn } from "@/lib/utils";

type StatCardProps = Readonly<{
  label: string;
  value: string | number;
  trend?: string;
  icon?: React.ReactNode;
  className?: string;
}>;

export function StatCard({ label, value, trend, icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border-default bg-surface p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</span>
        {icon ? <span className="text-brand-500">{icon}</span> : null}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold tracking-tight text-text-primary">{value}</span>
        {trend ? (
          <span className="mb-1 text-xs font-medium text-brand-600">{trend}</span>
        ) : null}
      </div>
    </div>
  );
}
