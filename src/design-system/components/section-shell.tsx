import { cn } from "@/lib/utils";

type SectionShellProps = Readonly<{
  width?: "narrow" | "page" | "wide";
  className?: string;
  children: React.ReactNode;
}>;

const widthClasses: Record<string, string> = {
  narrow: "container-narrow",
  page: "container-page",
  wide: "container-wide",
};

export function SectionShell({ width = "page", className, children }: SectionShellProps) {
  return (
    <main className={cn("min-h-screen py-8 lg:py-12", className)}>
      <div className={widthClasses[width]}>{children}</div>
    </main>
  );
}
