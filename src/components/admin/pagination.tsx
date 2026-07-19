import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface PaginationProps {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  /** Preserved query params other than `page`. */
  extraParams?: Record<string, string | undefined>;
}

function hrefFor(
  basePath: string,
  page: number,
  extraParams?: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extraParams ?? {})) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

export function Pagination({
  basePath,
  page,
  pageSize,
  total,
  extraParams,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  const hasPrev = current > 1;
  const hasNext = current < totalPages;

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <PageButton
          href={hrefFor(basePath, current - 1, extraParams)}
          disabled={!hasPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Prev</span>
        </PageButton>
        <span className="px-1 text-xs font-medium text-muted-foreground">
          Page {current} / {totalPages}
        </span>
        <PageButton
          href={hrefFor(basePath, current + 1, extraParams)}
          disabled={!hasNext}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" />
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  href,
  disabled,
  children,
  ...props
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
} & React.AriaAttributes) {
  const className = cn(
    "inline-flex h-9 items-center gap-1 rounded-xl border border-border/70 bg-card px-3 text-sm font-medium transition-colors",
    disabled
      ? "cursor-not-allowed opacity-50"
      : "text-foreground hover:bg-muted active:scale-[0.98]"
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled {...props}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
}
