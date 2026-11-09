import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** The brand symbol with empty cells: three dashed squares (records) and a soft circle (the client). */
function EmptyCells({ className }) {
    return (
        <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("size-14", className)}>
            <g className="fill-none stroke-muted-foreground/40" strokeWidth="2" strokeDasharray="4 4">
                <rect x="5" y="5" width="23" height="23" rx="7" />
                <rect x="5" y="36" width="23" height="23" rx="7" />
                <rect x="36" y="36" width="23" height="23" rx="7" />
            </g>
            <circle cx="47.5" cy="16.5" r="12" className="fill-apricot-500/30 dark:fill-apricot-500/40" />
        </svg>
    );
}

/**
 * Empty list or section: symbol with empty cells, title, optional description and action (a button).
 * `compact` for smaller places such as cards.
 */
export function EmptyState({ title, description, action, compact = false, className }) {
    return (
        <div className={cn("grid justify-items-center gap-3 text-center", compact ? "py-6" : "py-12", className)}>
            <EmptyCells className={compact ? "size-10" : undefined} />
            <div className="grid max-w-sm gap-1">
                <p className="font-medium text-foreground">{title}</p>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {action}
        </div>
    );
}

/** EmptyState spanning a whole table row. */
export function TableEmptyRow({ columnCount, ...emptyStateProps }) {
    return (
        <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columnCount} className="whitespace-normal">
                <EmptyState {...emptyStateProps} />
            </TableCell>
        </TableRow>
    );
}
