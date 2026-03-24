import { cn } from "@/lib/utils";

type CardVariant = "default" | "muted" | "outlined" | "terminal" | "glass";

type CardProps = Readonly<{
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  className?: string;
  children: React.ReactNode;
}>;

const variantClasses: Record<CardVariant, string> = {
  default: "bg-surface border-border-default shadow-card",
  muted: "bg-surface-muted border-border-muted",
  outlined: "bg-transparent border-border-strong",
  terminal: "bg-surface-terminal border-slate-700/50 text-text-inverse shadow-glow",
  glass: "bg-glass border-white/20 shadow-card",
};

const paddingClasses: Record<string, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  variant = "default",
  padding = "md",
  hover = false,
  className,
  children,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border",
        variantClasses[variant],
        paddingClasses[padding],
        hover && "transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = Readonly<{
  className?: string;
  children: React.ReactNode;
}>;

export function CardHeader({ className, children }: CardHeaderProps) {
  return <div className={cn("flex flex-col gap-1.5", className)}>{children}</div>;
}

type CardTitleProps = Readonly<{
  as?: "h2" | "h3" | "h4";
  className?: string;
  children: React.ReactNode;
}>;

export function CardTitle({ as: Tag = "h3", className, children }: CardTitleProps) {
  return <Tag className={cn("text-lg font-semibold text-text-primary", className)}>{children}</Tag>;
}

type CardDescriptionProps = Readonly<{
  className?: string;
  children: React.ReactNode;
}>;

export function CardDescription({ className, children }: CardDescriptionProps) {
  return <p className={cn("text-sm text-text-secondary", className)}>{children}</p>;
}
