import Link from "next/link";
import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  href: string;
};

type BreadcrumbsProps = Readonly<{
  items: BreadcrumbItem[];
  className?: string;
}>;

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumbs" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.href}-${item.label}`} className="flex items-center gap-1.5">
              {isLast ? (
                <span className="font-medium text-text-secondary" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "transition-colors hover:text-text-primary",
                  )}
                >
                  {item.label}
                </Link>
              )}
              {!isLast ? (
                <span aria-hidden="true" className="text-text-muted/50">
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
