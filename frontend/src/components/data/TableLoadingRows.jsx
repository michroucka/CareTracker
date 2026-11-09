import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

const WIDTHS = ["w-24", "w-32", "w-20", "w-28"];

/**
 * Skeleton rows while a table loads. `columns` lists the class name of each header cell in order, so
 * columns hidden on narrow tables are hidden in the skeleton too; `null` stands for the "⋯" column.
 * `avatar` draws the first column as a person (photo + two lines).
 */
export function TableLoadingRows({ columns, rows = 6, avatar = false }) {
    return Array.from({ length: rows }, (_, row) => (
        <TableRow key={row} className="hover:bg-transparent">
            {columns.map((className, column) => {
                if (className === null) return <TableCell key={column} className="w-12" />;
                if (column === 0 && avatar) {
                    return (
                        <TableCell key={column} className={className}>
                            <div className="flex items-center gap-3">
                                <Skeleton className="size-9 shrink-0 rounded-full" />
                                <div className="grid gap-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-40" /></div>
                            </div>
                        </TableCell>
                    );
                }
                return (
                    <TableCell key={column} className={className}>
                        <Skeleton className={`h-4 ${WIDTHS[(row + column) % WIDTHS.length]}`} />
                    </TableCell>
                );
            })}
        </TableRow>
    ));
}
