import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = Readonly<{
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}> &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-soft hover:shadow-elevated active:bg-brand-800 border-transparent",
  secondary:
    "bg-surface-muted text-text-primary hover:bg-stone-200 border-border-default active:bg-stone-300",
  outline:
    "bg-transparent text-text-primary hover:bg-surface-muted border-border-strong active:bg-stone-200",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-muted hover:text-text-primary border-transparent active:bg-stone-200",
  danger:
    "bg-danger text-white hover:bg-red-700 border-transparent shadow-soft active:bg-red-800",
  accent:
    "bg-accent-500 text-white hover:bg-accent-600 border-transparent shadow-soft active:bg-accent-700",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold border transition-all duration-200 cursor-pointer select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
