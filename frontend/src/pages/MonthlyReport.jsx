import React from "react";
import { IconLoader2, IconQrcode } from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { usePerformedTasks } from "../hooks/usePerformedTasks.jsx";
import { useDetailParam } from "../hooks/useDetailParam";
import { useMonthParam } from "../hooks/useListFilters";
import { fetchImage } from "../api/api.js";
import { formatTime } from "../utils/formatters.js";
import { MONTHS } from "../constants/globalConstants.js";
import MonthYearPicker from "@/components/MonthYearPicker";
import { formatCount, formatCurrency, pluralize } from "@/components/dashboard/dashboardFormat";
import { PageHeader } from "@/components/layout/PageHeader";
import { PerformedTaskSheet } from "@/components/performedTasks/PerformedTaskSheet";
import { DayRow } from "@/components/performedTasks/DayRow";
import { dayKey, summarizeByDay } from "@/components/performedTasks/dayGroups";
import { formatAmount } from "@/components/performedTasks/performedTaskForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLUMN_COUNT = 4;

function SummaryTile({ label, value, children }) {
    return (
        <Card className="gap-1 px-6 py-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="font-display text-3xl font-semibold tabular-nums">{value}</p>
                {children}
            </div>
        </Card>
    );
}

function PaymentQrDialog({ open, onOpenChange, clientId, period, total }) {
    const [qrUrl, setQrUrl] = React.useState(null);

    React.useEffect(() => {
        if (!open) return undefined;
        let objectUrl = null;
        let isCurrent = true;
        setQrUrl(null);
        fetchImage(`/performed-tasks/payment-qr?clientId=${clientId}&month=${period.month + 1}&year=${period.year}`)
            .then((url) => {
                objectUrl = url;
                if (isCurrent) setQrUrl(url);
            })
            .catch(() => isCurrent && onOpenChange(false));
        return () => {
            isCurrent = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
        // reload only when the dialog opens for another month
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, clientId, period.month, period.year]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>QR platba</DialogTitle>
                    <DialogDescription>
                        {MONTHS[period.month]} {period.year}: <span className="font-medium text-foreground tabular-nums">{formatCurrency(total)}</span>. Naskenujte kód v aplikaci své banky.
                    </DialogDescription>
                </DialogHeader>
                <div className="mx-auto grid size-64 place-items-center rounded-lg bg-white p-2">
                    {qrUrl
                        ? <img src={qrUrl} alt={`QR kód pro platbu ${formatCurrency(total)}`} className="size-full" />
                        : <IconLoader2 className="size-6 animate-spin text-muted-foreground" aria-label="Načítání QR kódu" />}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function MonthlyReport() {
    const { user } = useAuth();
    const [period, setPeriod] = useMonthParam();
    const { detailId, openDetail, closeDetail } = useDetailParam();
    const [detail, setDetail] = React.useState(null);
    const [isQrOpen, setIsQrOpen] = React.useState(false);
    const { performedTasks, loading, fetchPerformedTasks, fetchPerformedTask } = usePerformedTasks();

    React.useEffect(() => {
        if (!user.clientId) return;
        fetchPerformedTasks({ clientId: user.clientId, month: period.month, year: period.year });
        // fetchPerformedTasks is recreated on every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.clientId, period.month, period.year]);

    React.useEffect(() => {
        setDetail(null);
        if (!detailId) return;
        fetchPerformedTask(detailId).then(setDetail).catch(closeDetail);
        // fetchPerformedTask is recreated on every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailId]);

    const sortedTasks = React.useMemo(() => [...performedTasks].sort((a, b) => b.date.localeCompare(a.date)), [performedTasks]);
    const daySummaries = React.useMemo(() => summarizeByDay(sortedTasks), [sortedTasks]);
    const count = sortedTasks.length;
    const totalPrice = sortedTasks.reduce((sum, performedTask) => sum + (performedTask.price ?? 0), 0);

    return (
        <div className="grid gap-6">
            <PageHeader
                title="Měsíční přehled"
                description="Péče, kterou jste v daném měsíci dostali, a kolik za ni zaplatíte."
                actions={<MonthYearPicker value={period} onChange={setPeriod} />}
            />

            <div className="grid gap-4 sm:grid-cols-2">
                <SummaryTile label="Úkony" value={loading ? <Skeleton className="h-9 w-16" /> : formatCount(count)} />
                <SummaryTile label="K úhradě" value={loading ? <Skeleton className="h-9 w-32" /> : formatCurrency(totalPrice)}>
                    {!loading && count > 0 && <Button variant="outline" onClick={() => setIsQrOpen(true)}><IconQrcode /> QR platba</Button>}
                </SummaryTile>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-14 sm:w-20">Čas</TableHead>
                        <TableHead>Úkon</TableHead>
                        <TableHead className="@max-3xl/table:hidden">Pečovatelé</TableHead>
                        <TableHead className="text-right">Cena</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? Array.from({ length: 6 }, (_, index) => (
                        <TableRow key={index} className="hover:bg-transparent">
                            {Array.from({ length: COLUMN_COUNT }, (_, cell) => <TableCell key={cell}><Skeleton className="h-4 w-20" /></TableCell>)}
                        </TableRow>
                    )) : count === 0 ? (
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-muted-foreground">V tomto měsíci nebyla poskytnuta žádná péče.</TableCell>
                        </TableRow>
                    ) : sortedTasks.map((performedTask, index) => {
                        const day = dayKey(performedTask.date);
                        const startsDay = index === 0 || dayKey(sortedTasks[index - 1].date) !== day;
                        return (
                            <React.Fragment key={performedTask.id}>
                                {startsDay && <DayRow date={performedTask.date} summary={daySummaries.get(day)} columnCount={COLUMN_COUNT} />}
                                <TableRow data-state={performedTask.id === detailId ? "selected" : undefined} onClick={() => openDetail(performedTask.id)} className="cursor-pointer">
                                    <TableCell className="text-muted-foreground tabular-nums">{formatTime(performedTask.date)}</TableCell>
                                    <TableCell>
                                        <span className="font-medium">{performedTask.taskName}</span>
                                        <span className="ml-2 text-muted-foreground tabular-nums">{formatAmount(performedTask.unitCount, performedTask.unitType)}</span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground @max-3xl/table:hidden">
                                        {performedTask.caregivers?.map((caregiver) => caregiver.fullName).join(", ") || "–"}
                                    </TableCell>
                                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(performedTask.price)}</TableCell>
                                </TableRow>
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>
            {!loading && count > 0 && (
                <p className="text-right text-sm text-muted-foreground tabular-nums">
                    {formatCount(count)} {pluralize(count, ["úkon", "úkony", "úkonů"])} · celkem <span className="font-medium text-foreground">{formatCurrency(totalPrice)}</span>
                </p>
            )}

            <PerformedTaskSheet
                open={detailId != null}
                onOpenChange={(open) => !open && closeDetail()}
                performedTask={detail}
                isLoading={detailId != null && !detail}
                canEdit={false}
                linkClient={false}
            />
            <PaymentQrDialog open={isQrOpen} onOpenChange={setIsQrOpen} clientId={user.clientId} period={period} total={totalPrice} />
        </div>
    );
}

export default MonthlyReport;
