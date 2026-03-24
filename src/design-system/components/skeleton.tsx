import { cn } from "@/lib/utils";

type SkeletonProps = Readonly<{
  className?: string;
}>;

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-stone-200/60", className)}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-muted bg-surface p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-muted bg-surface p-5">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-8 w-12" />
    </div>
  );
}
