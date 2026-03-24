import { cn } from "@/lib/utils";

type DividerProps = Readonly<{
  label?: string;
  className?: string;
}>;

export function Divider({ label, className }: DividerProps) {
  if (label) {
    return (
      <div className={cn("flex items-center gap-3", className)} role="separator">
        <div className="h-px flex-1 bg-border-default" />
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <div className="h-px flex-1 bg-border-default" />
      </div>
    );
  }

  return <hr className={cn("h-px border-0 bg-border-default", className)} />;
}
