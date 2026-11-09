import React from "react";
import { IconDots } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_BADGES = {
    approved: { variant: "success", label: "Schváleno" },
    pending: { variant: "pending", label: "Čeká" },
};

const SAMPLE_ROWS = [
    { id: 1, client: "Marie Nováková", address: "Úslavská 12, Plzeň", task: "Pomoc při osobní hygieně", date: "24. 10.", amount: "6,5 h", price: "1 007,50 Kč", status: "approved" },
    { id: 2, client: "Josef Král", address: "Klatovská 88, Plzeň", task: "Dovoz oběda", date: "24. 10.", amount: "21×", price: "630,00 Kč", status: "pending" },
    { id: 3, client: "Anna Veselá", address: "Na Roudné 5, Plzeň", task: "Praní a žehlení prádla", date: "23. 10.", amount: "3,5 kg", price: "262,50 Kč", status: "approved" },
    { id: 4, client: "Karel Beneš", address: "Slovanská 41, Plzeň", task: "Nákup a pochůzky", date: "22. 10.", amount: "1,0 h", price: "155,00 Kč", status: "approved" },
];

const SKELETON_ROW_COUNT = 4;

function initials(name) {
    return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

function TableHeadRow() {
    return (
        <TableRow>
            <TableHead>Klient</TableHead>
            <TableHead>Úkon</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead className="text-right">Množství</TableHead>
            <TableHead className="text-right">Cena</TableHead>
            <TableHead>Stav</TableHead>
            <TableHead className="w-12"><span className="sr-only">Akce</span></TableHead>
        </TableRow>
    );
}

function LoadingRows() {
    return Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
        <TableRow key={index} className="hover:bg-transparent">
            <TableCell>
                <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="grid gap-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-36" />
                    </div>
                </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
            <TableCell><Skeleton className="ml-auto h-4 w-12" /></TableCell>
            <TableCell><Skeleton className="ml-auto h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
            <TableCell />
        </TableRow>
    ));
}

/**
 * Catalog example of a data table: client column with avatar, numeric columns aligned right,
 * status badges, row actions, selected row, total in the footer and a loading skeleton.
 */
export function TableExample() {
    const [selectedId, setSelectedId] = React.useState(2);
    const [isLoading, setIsLoading] = React.useState(false);

    return (
        <div className="grid gap-3">
            <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setIsLoading((loading) => !loading)}>
                    {isLoading ? "Zobrazit data" : "Zobrazit načítání"}
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableHeadRow />
                </TableHeader>
                <TableBody>
                    {isLoading ? <LoadingRows /> : SAMPLE_ROWS.map((row) => {
                        const status = STATUS_BADGES[row.status];
                        return (
                            <TableRow
                                key={row.id}
                                data-state={row.id === selectedId ? "selected" : undefined}
                                onClick={() => setSelectedId(row.id)}
                                className="cursor-pointer"
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                                            {initials(row.client)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground">{row.client}</p>
                                            <p className="text-xs text-muted-foreground">{row.address}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{row.task}</TableCell>
                                <TableCell className="text-muted-foreground tabular-nums">{row.date}</TableCell>
                                <TableCell className="text-right tabular-nums">{row.amount}</TableCell>
                                <TableCell className="text-right font-medium tabular-nums">{row.price}</TableCell>
                                <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                                <TableCell>
                                    <Button size="icon-row" variant="ghost" aria-label={`Akce pro ${row.client}`} onClick={(event) => event.stopPropagation()}>
                                        <IconDots />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
                {!isLoading && (
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={4}>Celkem za říjen</TableCell>
                            <TableCell className="text-right">2 055,00 Kč</TableCell>
                            <TableCell colSpan={2} />
                        </TableRow>
                    </TableFooter>
                )}
            </Table>
        </div>
    );
}
