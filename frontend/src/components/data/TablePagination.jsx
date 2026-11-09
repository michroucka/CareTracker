import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/components/dashboard/dashboardFormat";
import { pageCountOf } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const GAP = "gap";

/** [1, "gap", 4, 5, 6, "gap", 61]: first, last and the pages around the current one. */
function visiblePages(page, pageCount) {
    const pages = [];
    for (let candidate = 1; candidate <= pageCount; candidate++) {
        const isEdge = candidate === 1 || candidate === pageCount;
        const isNear = Math.abs(candidate - page) <= 1;
        if (isEdge || isNear) pages.push(candidate);
        else if (pages.at(-1) !== GAP) pages.push(GAP);
    }
    return pages;
}

/**
 * Pagination bar under a table, stuck to the bottom of the scrolling window so it stays at hand.
 * `page` is 1-based. Renders nothing when everything fits on one page.
 */
export function TablePagination({ page, pageSize, totalCount, onPageChange, className }) {
    const pageCount = pageCountOf(totalCount, pageSize);
    if (pageCount <= 1) return null;

    const first = (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, totalCount);

    return (
        <nav
            aria-label="Stránkování"
            className={cn("sticky bottom-0 z-10 -mt-3 flex flex-wrap items-center justify-between gap-2 border-t bg-background/95 py-3 backdrop-blur-sm", className)}
        >
            <p className="text-sm text-muted-foreground tabular-nums">
                {formatCount(first)}–{formatCount(last)} z {formatCount(totalCount)}
            </p>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-row" aria-label="Předchozí stránka" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                    <IconChevronLeft />
                </Button>
                {visiblePages(page, pageCount).map((item, index) => item === GAP ? (
                    <span key={`gap-${index}`} className="w-6 text-center text-muted-foreground max-sm:hidden" aria-hidden="true">…</span>
                ) : (
                    <Button
                        key={item}
                        variant={item === page ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 min-w-8 px-2 tabular-nums max-sm:hidden"
                        aria-label={`Stránka ${item}`}
                        aria-current={item === page ? "page" : undefined}
                        onClick={() => onPageChange(item)}
                    >
                        {item}
                    </Button>
                ))}
                <span className="px-2 text-sm tabular-nums sm:hidden">{page} / {pageCount}</span>
                <Button variant="ghost" size="icon-row" aria-label="Další stránka" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
                    <IconChevronRight />
                </Button>
            </div>
        </nav>
    );
}
