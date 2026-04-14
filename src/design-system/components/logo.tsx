import { cn } from "@/lib/utils";

type LogoProps = Readonly<{
  size?: "sm" | "md" | "lg";
  variant?: "full" | "mark" | "text" | "mono";
  className?: string;
}>;

const sizeConfig = {
  sm: { mark: 28, text: "text-lg", tagline: "text-[0.6rem]" },
  md: { mark: 36, text: "text-xl", tagline: "text-[0.65rem]" },
  lg: { mark: 44, text: "text-2xl", tagline: "text-xs" },
};

function PrismaMark({ size, className }: { size: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Adapta Prova"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
      className={className}
    />
  );
}

export function Logo({ size = "md", variant = "full", className }: LogoProps) {
  const config = sizeConfig[size];

  if (variant === "mark") {
    return <PrismaMark size={config.mark} className={className} />;
  }

  if (variant === "text") {
    return (
      <span className={cn("font-bold tracking-tight text-text-primary", config.text, className)}>
        Adapta <span className="text-brand-600">Prova</span>
      </span>
    );
  }

  if (variant === "mono") {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <PrismaMark size={config.mark} />
        <div className="flex flex-col">
          <span className={cn("font-bold tracking-tight leading-none text-white", config.text)}>
            Adapta <span className="text-brand-200">Prova</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <PrismaMark size={config.mark} />
      <div className="flex flex-col">
        <span className={cn("font-bold tracking-tight leading-none text-text-primary", config.text)}>
          Adapta <span className="text-brand-600">Prova</span>
        </span>
        <span className={cn("font-medium tracking-widest uppercase text-text-muted", config.tagline)}>
          Plataforma Educacional ✨
        </span>
      </div>
    </div>
  );
}
