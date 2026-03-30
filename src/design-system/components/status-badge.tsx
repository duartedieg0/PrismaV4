import { cn } from "@/lib/utils";

type StatusBadgeProps = Readonly<{
  label: string;
  tone?: "default" | "secondary" | "destructive" | "outline" | "warning";
}>;

const toneClasses = {
  default: "bg-green-50 text-green-700 border-green-200",
  secondary: "bg-surface-muted text-text-secondary border-border-default",
  destructive: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  outline: "bg-white/70 text-text-primary border-border-strong",
} as const;

export function StatusBadge({ label, tone = "default" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-pill border px-3 py-1.5 text-xs font-bold uppercase tracking-wider",
        toneClasses[tone],
      )}
    >
      {label}
    </span>
  );
}
