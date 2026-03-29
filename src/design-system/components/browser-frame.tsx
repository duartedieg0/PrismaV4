import { cn } from "@/lib/utils";

type BrowserFrameProps = Readonly<{
  url?: string;
  className?: string;
  children: React.ReactNode;
}>;

export function BrowserFrame({ url = "adapteminhaprova.com.br", className, children }: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border-default bg-surface shadow-elevated",
        className,
      )}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border-default bg-surface-muted px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400" aria-hidden="true" />
          <span className="h-3 w-3 rounded-full bg-amber-400" aria-hidden="true" />
          <span className="h-3 w-3 rounded-full bg-green-400" aria-hidden="true" />
        </div>
        <div className="ml-2 flex-1 rounded-md bg-white px-3 py-1">
          <span className="text-xs text-text-muted">{url}</span>
        </div>
      </div>
      {/* Content */}
      <div className="bg-white">
        {children}
      </div>
    </div>
  );
}
