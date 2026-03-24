import { cn } from "@/lib/utils";

type SurfaceVariant = "default" | "muted" | "raised" | "glass" | "terminal";

type NamedPadding = "none" | "sm" | "md" | "lg";

type SurfaceProps = Readonly<{
  variant?: SurfaceVariant;
  padding?: NamedPadding | (string & {});
  tone?: "default" | "muted" | "hero";
  className?: string;
  children: React.ReactNode;
}>;

const variantClasses: Record<SurfaceVariant, string> = {
  default: "bg-surface border-border-default shadow-card",
  muted: "bg-surface-muted border-border-muted",
  raised: "bg-surface-raised border-border-default shadow-elevated",
  glass: "bg-glass border-white/20 shadow-card",
  terminal: "bg-surface-terminal border-slate-700/50 text-text-inverse shadow-glow",
};

const paddingMap: Record<NamedPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

function isNamedPadding(p: string): p is NamedPadding {
  return p in paddingMap;
}

export function Surface({
  variant = "default",
  padding = "md",
  tone,
  className,
  children,
}: SurfaceProps) {
  const resolvedVariant = tone === "hero" ? "raised" : tone === "muted" ? "muted" : variant;
  const paddingClass = isNamedPadding(padding) ? paddingMap[padding] : undefined;
  const paddingStyle = isNamedPadding(padding) ? undefined : { padding };

  return (
    <section
      className={cn(
        "rounded-2xl border",
        variantClasses[resolvedVariant],
        paddingClass,
        className,
      )}
      style={paddingStyle}
    >
      {children}
    </section>
  );
}
