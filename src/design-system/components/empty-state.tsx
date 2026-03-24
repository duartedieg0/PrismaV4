import { cn } from "@/lib/utils";

type EmptyStateProps = Readonly<{
  title?: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}>;

export function EmptyState({ title, message, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border-strong bg-surface-muted/50 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
          {icon}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        {title ? (
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        ) : null}
        <p className="max-w-sm text-sm text-text-secondary">{message}</p>
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
