import React from "react";
import { useSearchParams } from "react-router-dom";
import { useSearchParamsUpdater } from "../hooks/useSearchParamsUpdater";
import { IconArrowDown, IconArrowUp, IconDots, IconLayoutSidebarRightExpand, IconPlus, IconPrinter, IconTrash } from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useClients } from "../hooks/useClients.jsx";
import { useDepartments } from "../hooks/useDepartments.jsx";
import { useDetailParam } from "../hooks/useDetailParam";
import { useEmployees } from "../hooks/useEmployees.jsx";
import { useMonthParam, useMultiSelectParam, useTextParam } from "../hooks/useListFilters";
import { usePagedList } from "../hooks/usePagedList";
import { usePerformedTasks } from "../hooks/usePerformedTasks.jsx";
import { useTasks } from "../hooks/useTasks.jsx";
import { ROLES } from "../constants/roles.js";
import { formatTime, removeDiacritics } from "../utils/formatters.js";
import MonthYearPicker from "@/components/MonthYearPicker";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { TableEmptyRow } from "@/components/data/EmptyState";
import { TableLoadingRows } from "@/components/data/TableLoadingRows";
import { ListToolbar } from "@/components/data/ListToolbar";
import { MultiSelectFilter } from "@/components/data/MultiSelectFilter";
import { TablePagination } from "@/components/data/TablePagination";
import { formatCount, formatCurrency, pluralize } from "@/components/dashboard/dashboardFormat";
import { PageHeader } from "@/components/layout/PageHeader";
import { PerformedTaskCreateSheet } from "@/components/performedTasks/PerformedTaskCreateSheet";
import { DayFilter } from "@/components/performedTasks/DayFilter";
import { DayRow } from "@/components/performedTasks/DayRow";
import { dayKey, summarizeByDay } from "@/components/performedTasks/dayGroups";
import { PerformedTaskSheet } from "@/components/performedTasks/PerformedTaskSheet";
import { ReceiptDialog } from "@/components/performedTasks/ReceiptDialog";
import { formatAmount } from "@/components/performedTasks/performedTaskForm";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ADMIN_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN];

/** Memoized so sorting and opening a detail move existing rows instead of re-rendering ~1500 of them. */
const PerformedTaskRow = React.memo(function PerformedTaskRow({ performedTask, isSelected, canEdit, onOpen, onDelete }) {
    return (
        <TableRow data-state={isSelected ? "selected" : undefined} onClick={() => onOpen(performedTask.id)} className="cursor-pointer">
            <TableCell className="w-14 text-muted-foreground tabular-nums @xl/table:w-20">{formatTime(performedTask.date)}</TableCell>
            <TableCell className="@max-3xl/table:w-full @max-3xl/table:max-w-0">
                <span className="block truncate font-medium text-foreground">{performedTask.clientName}</span>
                <span className="block truncate text-xs text-muted-foreground @3xl/table:hidden">{performedTask.taskName} · {formatAmount(performedTask.unitCount, performedTask.unitType)}</span>
            </TableCell>
            <TableCell className="@max-3xl/table:hidden">
                {performedTask.taskName}
                <span className="ml-2 text-muted-foreground tabular-nums">{formatAmount(performedTask.unitCount, performedTask.unitType)}</span>
            </TableCell>
            <TableCell className="text-muted-foreground @max-4xl/table:hidden">
                {performedTask.caregivers?.map((caregiver) => caregiver.fullName).join(", ") || "–"}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">{formatCurrency(performedTask.price)}</TableCell>
            <TableCell onClick={(event) => event.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon-row" variant="ghost" aria-label={`Akce pro záznam ${performedTask.taskName} u klienta ${performedTask.clientName}`}><IconDots /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onOpen(performedTask.id)}><IconLayoutSidebarRightExpand /> Otevřít detail</DropdownMenuItem>
                        {canEdit && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onSelect={() => onDelete(performedTask)}><IconTrash /> Smazat záznam</DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
});

// rows are small and a month holds over a thousand records, so pages are longer than in other lists
const PERFORMED_TASKS_PAGE_SIZE = 50;

const monthPrefix = ({ month, year }) => `${year}-${String(month + 1).padStart(2, "0")}`;

function PerformedTasks() {
    const { user, superadminOrg } = useAuth();
    const [searchParams] = useSearchParams();
    const updateSearchParams = useSearchParamsUpdater();
    // only admins choose departments; coordinators and caregivers see their own department
    const canFilterDepartments = ADMIN_ROLES.includes(user.role);

    const [search, setSearch] = useTextParam("search");
    const [day, setDay] = useTextParam("day");
    const [period, setPeriod] = useMonthParam();
    const [departmentFilter, setDepartmentFilter] = useMultiSelectParam("departments", user.role !== ROLES.SUPERADMIN && user.departmentId ? [user.departmentId] : []);
    const [caregiverFilter, setCaregiverFilter] = useMultiSelectParam("caregivers");
    const [sortDirection, setSortDirection] = React.useState("descending");
    const [isSorting, startSorting] = React.useTransition();
    const { detailId, openDetail, closeDetail } = useDetailParam();
    const [detail, setDetail] = React.useState(null);
    const [isCreateOpen, setIsCreateOpen] = React.useState(() => searchParams.get("openCreate") === "true");
    const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
    const [deleteTarget, setDeleteTarget] = React.useState(null);

    const { performedTasks, setPerformedTasks, loading, fetchPerformedTasks, fetchPerformedTask, createPerformedTask, updatePerformedTask, deletePerformedTask } = usePerformedTasks();
    const { clients, fetchClients } = useClients();
    const { departments, fetchDepartments } = useDepartments();
    const { employees, fetchEmployees } = useEmployees();
    const { tasks, fetchTasks } = useTasks();

    const needsOrganization = user.role === ROLES.SUPERADMIN && !superadminOrg;
    const organizationId = superadminOrg?.id;
    const departmentIds = canFilterDepartments ? [...departmentFilter].map(Number) : [user.departmentId];
    const inSelectedDepartments = (record) => departmentIds.length === 0 || departmentIds.includes(record.department?.id);

    // caregivers and clients offered in filters and forms follow the department selection
    const departmentEmployees = React.useMemo(() => employees.filter(inSelectedDepartments),
    // departmentIds is derived from departmentFilter
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [employees, departmentFilter, user.departmentId]);
    const departmentClients = React.useMemo(() => clients.filter(inSelectedDepartments),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clients, departmentFilter, user.departmentId]);

    const caregiverOptions = departmentEmployees.map((employee) => ({ value: employee.id, label: `${employee.firstName} ${employee.lastName}` }));
    const caregiverIds = [...caregiverFilter].map(Number).filter((id) => caregiverOptions.some((option) => option.value === id));
    const filterKey = `${departmentIds.join(",")}|${caregiverIds.join(",")}|${period.month}|${period.year}`;

    React.useEffect(() => {
        if (searchParams.get("openCreate") === null) return;
        updateSearchParams((next) => {
            next.delete("openCreate");
        }, { replace: true });
        // only the link from the dashboard carries the flag
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const previousOrganizationId = React.useRef(organizationId);
    React.useEffect(() => {
        if (previousOrganizationId.current !== organizationId) {
            setDepartmentFilter(new Set());
            setCaregiverFilter(new Set());
        }
        previousOrganizationId.current = organizationId;
    }, [organizationId, setDepartmentFilter, setCaregiverFilter]);

    React.useEffect(() => {
        if (needsOrganization) return;
        fetchDepartments({ organizationId, status: true });
        fetchEmployees({ organizationId, status: true });
        fetchClients({ organizationId, status: true });
        fetchTasks({ organizationId, status: true });
        // reload filter and form options when the organization changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId, needsOrganization]);

    React.useEffect(() => {
        if (needsOrganization) {
            setPerformedTasks([]);
            return;
        }
        fetchPerformedTasks({
            organizationId,
            departmentIds: departmentIds.length ? departmentIds : undefined,
            caregiverIds: caregiverIds.length ? caregiverIds : undefined,
            month: period.month,
            year: period.year,
        });
        // filterKey stands for departmentIds, caregiverIds and the period
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId, filterKey, needsOrganization]);

    React.useEffect(() => {
        setDetail(null);
        if (!detailId) return;
        fetchPerformedTask(detailId).then(setDetail).catch(closeDetail);
        // load whenever another record is opened
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailId]);

    const matchingTasks = React.useMemo(() => {
        const query = removeDiacritics(search.trim());
        // a record created for another month is added to the list by the hook; keep it out of this one
        const inPeriod = performedTasks.filter((performedTask) => performedTask.date.startsWith(monthPrefix(period)));
        return query
            ? inPeriod.filter((performedTask) => removeDiacritics(`${performedTask.clientName} ${performedTask.taskName}`).includes(query))
            : inPeriod;
    }, [performedTasks, search, period]);

    const daysWithRecords = React.useMemo(() => [...new Set(matchingTasks.map((performedTask) => dayKey(performedTask.date)))].sort(), [matchingTasks]);
    // a day from the URL that is not in the month (or has no matching records) shows the whole month
    const selectedDay = daysWithRecords.includes(day) ? day : "";

    const visibleTasks = React.useMemo(() => {
        const inDay = selectedDay ? matchingTasks.filter((performedTask) => dayKey(performedTask.date) === selectedDay) : matchingTasks;
        const direction = sortDirection === "ascending" ? 1 : -1;
        return [...inDay].sort((a, b) => direction * a.date.localeCompare(b.date));
    }, [matchingTasks, selectedDay, sortDirection]);

    const canEditRecord = (performedTask) => user.role !== ROLES.CAREGIVER
        || performedTask?.caregivers?.some((caregiver) => caregiver.id === user.employeeId);

    const saveDetail = async (id, request) => setDetail(await updatePerformedTask(id, request));

    const confirmDelete = async () => {
        await deletePerformedTask(deleteTarget.id);
        if (detailId === deleteTarget.id) closeDetail();
    };

    const count = visibleTasks.length;
    const { pageItems, tableRef, withPageReset, paginationProps } = usePagedList(visibleTasks, { resetKey: organizationId, pageSize: PERFORMED_TASKS_PAGE_SIZE });
    const totalPrice = visibleTasks.reduce((sum, performedTask) => sum + (performedTask.price ?? 0), 0);
    const columnCount = 6;
    // count and price per day over the whole filtered list, so a day split across pages shows its full total
    const daySummaries = React.useMemo(() => summarizeByDay(visibleTasks), [visibleTasks]);
    const toggleSort = () => startSorting(() => withPageReset(setSortDirection)(sortDirection === "descending" ? "ascending" : "descending"));
    const SortIcon = sortDirection === "descending" ? IconArrowDown : IconArrowUp;

    return (
        <div className="grid gap-6">
            <PageHeader
                title="Provedené úkony"
                description="Záznamy péče, ze kterých vznikají měsíční výkazy a stvrzenky."
                actions={!needsOrganization && (
                    <>
                        <Button variant="outline" onClick={() => setIsReceiptOpen(true)}><IconPrinter /> Stvrzenka</Button>
                        <Button onClick={() => setIsCreateOpen(true)}><IconPlus /> Zapsat úkon</Button>
                    </>
                )}
            />

            <ListToolbar
                search={search}
                onSearchChange={withPageReset(setSearch)}
                searchPlaceholder="Hledat podle klienta nebo úkonu…"
                isLoading={loading && !needsOrganization}
                countLabel={needsOrganization ? null : `${formatCount(count)} ${pluralize(count, ["záznam", "záznamy", "záznamů"])} · ${formatCurrency(totalPrice)}`}
            >
                {!needsOrganization && (
                    <>
                        <MonthYearPicker value={period} onChange={withPageReset((nextPeriod) => { setPeriod(nextPeriod); setDay(""); })} />
                        <DayFilter period={period} days={daysWithRecords} value={selectedDay} onChange={withPageReset(setDay)} isDisabled={loading} />
                        {canFilterDepartments && (
                            <MultiSelectFilter label="Středisko" allLabel="Všechna" options={departments.map((department) => ({ value: department.id, label: department.city }))} selected={departmentFilter} onChange={withPageReset(setDepartmentFilter)} searchPlaceholder="Hledat středisko…" />
                        )}
                        <MultiSelectFilter label="Pečovatel" allLabel="Všichni" options={caregiverOptions} selected={caregiverFilter} onChange={withPageReset(setCaregiverFilter)} searchPlaceholder="Hledat pečovatele…" />
                    </>
                )}
            </ListToolbar>

            <Table ref={tableRef}>
                <TableHeader>
                    <TableRow>
                        <TableHead aria-sort={sortDirection}>
                            <button type="button" onClick={toggleSort} className="-mx-1 inline-flex items-center gap-1 rounded px-1 uppercase transition-colors duration-fast ease-out hover:text-foreground">
                                Datum <SortIcon className="size-3.5" />
                            </button>
                        </TableHead>
                        <TableHead>Klient</TableHead>
                        <TableHead className="@max-3xl/table:hidden">Úkon</TableHead>
                        <TableHead className="@max-4xl/table:hidden">Pečovatelé</TableHead>
                        <TableHead className="text-right">Cena</TableHead>
                        <TableHead className="w-12"><span className="sr-only">Akce</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className={cn("transition-opacity duration-base ease-out", isSorting && "opacity-50")} aria-busy={isSorting || undefined}>
                    {needsOrganization ? (
                        <TableEmptyRow columnCount={columnCount} title="Vyberte organizaci" description="Organizaci přepnete v postranním panelu." />
                    ) : loading ? <TableLoadingRows rows={8} columns={["", "", "@max-3xl/table:hidden", "@max-4xl/table:hidden", "text-right", null]} /> : count === 0 ? (
                        (search
                        ? <TableEmptyRow columnCount={columnCount} title="Žádný záznam neodpovídá hledání" description="Hledá se podle jména klienta a názvu úkonu." action={<Button variant="outline" size="sm" onClick={() => setSearch("")}>Zrušit hledání</Button>} />
                        : <TableEmptyRow columnCount={columnCount} title="V tomto měsíci zatím nic" description="Zapsané úkony se tu objeví den po dni." action={<Button size="sm" onClick={() => setIsCreateOpen(true)}><IconPlus /> Zapsat úkon</Button>} />)
                    ) : pageItems.map((performedTask, index) => {
                        const day = dayKey(performedTask.date);
                        const startsDay = index === 0 || dayKey(pageItems[index - 1].date) !== day;
                        return (
                            <React.Fragment key={performedTask.id}>
                                {startsDay && <DayRow date={performedTask.date} summary={daySummaries.get(day)} columnCount={columnCount} />}
                                <PerformedTaskRow
                                    performedTask={performedTask}
                                    isSelected={performedTask.id === detailId}
                                    canEdit={canEditRecord(performedTask)}
                                    onOpen={openDetail}
                                    onDelete={setDeleteTarget}
                                />
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>

            {!needsOrganization && !loading && (
                <TablePagination {...paginationProps} />
            )}

            <PerformedTaskSheet
                open={detailId != null}
                onOpenChange={(open) => !open && closeDetail()}
                performedTask={detail}
                isLoading={detailId != null && !detail}
                canEdit={canEditRecord(detail)}
                clients={departmentClients}
                tasks={tasks}
                caregivers={departmentEmployees}
                onSave={saveDetail}
                onDelete={() => setDeleteTarget(detail)}
            />

            <PerformedTaskCreateSheet
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onCreate={createPerformedTask}
                clients={departmentClients}
                tasks={tasks}
                caregivers={departmentEmployees}
                defaultCaregiverId={user.employeeId}
            />

            <ReceiptDialog
                open={isReceiptOpen}
                onOpenChange={setIsReceiptOpen}
                clients={departmentClients}
                departments={canFilterDepartments ? departments : departments.filter((department) => department.id === user.departmentId)}
                defaultDepartmentId={departmentIds.length === 1 ? departmentIds[0] : user.departmentId}
                canChooseDepartment={canFilterDepartments}
                initialMonth={period}
            />

            <ConfirmDialog
                open={deleteTarget != null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Smazat záznam úkonu?"
                description={deleteTarget ? `${deleteTarget.taskName ?? deleteTarget.task?.name} u klienta ${deleteTarget.clientName ?? deleteTarget.client?.fullName} se trvale odstraní a nebude ve výkazu ani na stvrzence.` : ""}
                confirmLabel="Smazat"
                destructive
                onConfirm={confirmDelete}
            />
        </div>
    );
}

export default PerformedTasks;
