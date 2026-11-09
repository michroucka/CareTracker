import { formatCurrency, pluralize } from "@/components/dashboard/dashboardFormat";
import { TableCell, TableRow } from "@/components/ui/table";

const dayFormatter = new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long" });

/** "2026-11-06T15:22:00" → "Pátek 6. listopadu"; the year is shown by the month picker. */
function formatDay(date) {
    const label = dayFormatter.format(new Date(date));
    return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Day heading inside the table with the day's record count and total on the right. */
export function DayRow({ date, summary, columnCount }) {
    return (
        <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableCell colSpan={columnCount} className="py-2">
                <div className="flex items-baseline justify-between gap-4">
                    <span className="font-medium">{formatDay(date)}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                        <span className="max-sm:hidden">{summary.count} {pluralize(summary.count, ["záznam", "záznamy", "záznamů"])} · </span>
                        {formatCurrency(summary.price)}
                    </span>
                </div>
            </TableCell>
        </TableRow>
    );
}
