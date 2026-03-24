import { cn } from "@/lib/utils";

type LogoProps = Readonly<{
  size?: "sm" | "md" | "lg";
  variant?: "full" | "mark" | "text";
  className?: string;
}>;

const sizeConfig = {
  sm: { mark: "w-7 h-7 text-xs", text: "text-lg", tagline: "text-[0.6rem]" },
  md: { mark: "w-9 h-9 text-sm", text: "text-xl", tagline: "text-[0.65rem]" },
  lg: { mark: "w-11 h-11 text-base", text: "text-2xl", tagline: "text-xs" },
};

function PrismaMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-brand-600 font-bold text-white shadow-glow",
        className,
      )}
      aria-hidden="true"
    >
      A
    </span>
  );
}

export function Logo({ size = "md", variant = "full", className }: LogoProps) {
  const config = sizeConfig[size];

  if (variant === "mark") {
    return <PrismaMark className={cn(config.mark, className)} />;
  }

  if (variant === "text") {
    return (
      <span className={cn("font-bold tracking-tight text-text-primary", config.text, className)}>
        Adapte <span className="text-brand-600">Minha Prova</span>
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <PrismaMark className={config.mark} />
      <div className="flex flex-col">
        <span className={cn("font-bold tracking-tight leading-none text-text-primary", config.text)}>
          Adapte <span className="text-brand-600">Minha Prova</span>
        </span>
        <span className={cn("font-medium tracking-widest uppercase text-text-muted", config.tagline)}>
          Plataforma educacional com IA
        </span>
      </div>
    </div>
  );
}
