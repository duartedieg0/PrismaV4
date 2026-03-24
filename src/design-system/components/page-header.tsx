import { cn } from "@/lib/utils";

type PageHeaderProps = Readonly<{
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}>;

export function PageHeader({ title, eyebrow, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="flex max-w-2xl flex-col gap-2">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-text-primary lg:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-prose text-base text-text-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
