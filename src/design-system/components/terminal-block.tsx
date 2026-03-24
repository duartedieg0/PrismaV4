import { cn } from "@/lib/utils";

type TerminalBlockProps = Readonly<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}>;

export function TerminalBlock({ title = "terminal", children, className }: TerminalBlockProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-700/50 bg-surface-terminal shadow-glow",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-700/50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500/80" aria-hidden="true" />
          <span className="h-3 w-3 rounded-full bg-amber-500/80" aria-hidden="true" />
          <span className="h-3 w-3 rounded-full bg-green-500/80" aria-hidden="true" />
        </div>
        <span className="ml-2 font-code text-xs text-slate-400">{title}</span>
      </div>
      <div className="p-5 font-code text-sm leading-relaxed text-slate-300">
        {children}
      </div>
    </div>
  );
}

type TerminalLineProps = Readonly<{
  prompt?: string;
  command?: string;
  output?: string;
  className?: string;
}>;

export function TerminalLine({ prompt = "$", command, output, className }: TerminalLineProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {command ? (
        <div className="flex gap-2">
          <span className="text-brand-400">{prompt}</span>
          <span className="text-slate-100">{command}</span>
          <span className="animate-terminal-blink text-brand-400">|</span>
        </div>
      ) : null}
      {output ? <div className="text-slate-400 pl-5">{output}</div> : null}
    </div>
  );
}
