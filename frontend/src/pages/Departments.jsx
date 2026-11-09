import React from "react";
import { IconBan, IconCircleCheck, IconDots, IconLayoutSidebarRightExpand, IconPlus } from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useDepartments } from "../hooks/useDepartments.jsx";
import { useEmployees } from "../hooks/useEmployees.jsx";
import { useDetailParam } from "../hooks/useDetailParam";
import { useListFilters } from "../hooks/useListFilters";
import { usePagedList } from "../hooks/usePagedList";
import { ROLES } from "../constants/roles.js";
import { removeDiacritics } from "../utils/formatters.js";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { TableEmptyRow } from "@/components/data/EmptyState";
import { ListToolbar } from "@/components/data/ListToolbar";
import { TablePagination } from "@/components/data/TablePagination";
import { StatusBadge } from "@/components/data/StatusBadge";
import { DepartmentCreateDialog } from "@/components/departments/DepartmentCreateDialog";
import { DepartmentSheet } from "@/components/departments/DepartmentSheet";
import { pluralize } from "@/components/dashboard/dashboardFormat";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const COLUMN_COUNT = 6;

function LoadingRows() {
    return Array.from({ length: 4 }, (_, index) => (
        <TableRow key={index} className="hover:bg-transparent">
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell className="@max-3xl/table:hidden"><Skeleton className="h-4 w-44" /></TableCell>
            <TableCell className="@max-4xl/table:hidden"><Skeleton className="h-4 w-10" /></TableCell>
            <TableCell className="@max-3xl/table:hidden"><Skeleton className="h-4 w-36" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
            <TableCell />
        </TableRow>
    ));
}

function Departments() {
    const { user, superadminOrg } = useAuth();
    const { search, setSearch, statusFilter, setStatusFilter, apiStatus } = useListFilters();
    const { detailId, openDetail, closeDetail } = useDetailParam();
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [confirmAction, setConfirmAction] = React.useState(null);
    const [detail, setDetail] = React.useState(null);

    const {
        departments,
        setDepartments,
        loading,
        fetchDepartments,
        fetchDepartment,
        createDepartment,
        updateDepartment,
        terminateDepartment,
        activateDepartment,
    } = useDepartments();
    const { employees, fetchEmployees } = useEmployees();

    const needsOrganization = user.role === ROLES.SUPERADMIN && !superadminOrg;
    const organizationId = superadminOrg?.id;

    React.useEffect(() => {
        if (needsOrganization) {
            setDepartments([]);
            return;
        }
        fetchDepartments({ organizationId, status: apiStatus });
        fetchEmployees({ organizationId, status: true });
        // refetch when the organization or the status filter changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId, apiStatus, needsOrganization]);

    React.useEffect(() => {
        setDetail(null);
        if (!detailId) return;
        fetchDepartment(detailId).then(setDetail).catch(closeDetail);
        // load whenever another department is opened
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailId]);

    const visibleDepartments = React.useMemo(() => {
        const query = removeDiacritics(search.trim());
        return [...departments]
            .filter((department) => !query || removeDiacritics(`${department.city} ${department.street}`).includes(query))
            .sort((a, b) => a.city.localeCompare(b.city, "cs"));
    }, [departments, search]);

    const askTerminate = (department) => setConfirmAction({ type: "terminate", department });
    const askActivate = (department) => setConfirmAction({ type: "activate", department });

    const runConfirmedAction = async () => {
        const { type, department } = confirmAction;
        if (type === "terminate") await terminateDepartment(department.id);
        else await activateDepartment(department.id);
        if (detail?.id === department.id) setDetail(await fetchDepartment(department.id));
    };

    const saveDepartment = async (id, request) => {
        await updateDepartment(id, request);
        setDetail(await fetchDepartment(id));
        fetchEmployees({ organizationId, status: true }, { silent: true });
    };

    const createAndRefresh = async (request) => {
        await createDepartment(request);
        fetchEmployees({ organizationId, status: true }, { silent: true });
    };

    const { pageItems, tableRef, withPageReset, paginationProps } = usePagedList(visibleDepartments, { resetKey: organizationId });
    const count = visibleDepartments.length;

    return (
        <div className="grid gap-6">
            <PageHeader
                title="Střediska"
                description={superadminOrg ? `Regionální pobočky organizace ${superadminOrg.name}.` : "Regionální pobočky organizace."}
                actions={!needsOrganization && <Button onClick={() => setIsCreateOpen(true)}><IconPlus /> Nové středisko</Button>}
            />

            <ListToolbar
                search={search}
                onSearchChange={withPageReset(setSearch)}
                searchPlaceholder="Hledat podle města nebo ulice…"
                statusFilter={statusFilter}
                onStatusFilterChange={withPageReset(setStatusFilter)}
                isLoading={loading && !needsOrganization}
                countLabel={needsOrganization ? null : `${count} ${pluralize(count, ["středisko", "střediska", "středisek"])}`}
            />

            <Table ref={tableRef}>
                <TableHeader>
                    <TableRow>
                        <TableHead>Město</TableHead>
                        <TableHead className="@max-3xl/table:hidden">Adresa</TableHead>
                        <TableHead className="@max-4xl/table:hidden">Číslo</TableHead>
                        <TableHead className="@max-3xl/table:hidden">Koordinátor</TableHead>
                        <TableHead>Stav</TableHead>
                        <TableHead className="w-12"><span className="sr-only">Akce</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {needsOrganization ? (
                        <TableEmptyRow columnCount={COLUMN_COUNT} title="Vyberte organizaci" description="Organizaci přepnete v postranním panelu." />
                    ) : loading ? <LoadingRows /> : count === 0 ? (
                        (search
                        ? <TableEmptyRow columnCount={COLUMN_COUNT} title="Žádné středisko neodpovídá hledání" description="Zkuste jiný název nebo město." action={<Button variant="outline" size="sm" onClick={() => setSearch("")}>Zrušit hledání</Button>} />
                        : <TableEmptyRow columnCount={COLUMN_COUNT} title="Zatím tu není žádné středisko" description="Střediska jsou pobočky organizace, ke kterým patří klienti a zaměstnanci." action={<Button size="sm" onClick={() => setIsCreateOpen(true)}><IconPlus /> Nové středisko</Button>} />)
                    ) : pageItems.map((department) => (
                        <TableRow
                            key={department.id}
                            data-state={department.id === detailId ? "selected" : undefined}
                            onClick={() => openDetail(department.id)}
                            className={cn("cursor-pointer", !department.active && "text-muted-foreground")}
                        >
                            <TableCell className="font-medium">{department.city}</TableCell>
                            <TableCell className="@max-3xl/table:hidden">{department.street}{department.postalCode && <span className="text-muted-foreground">, {department.postalCode}</span>}</TableCell>
                            <TableCell className="tabular-nums @max-4xl/table:hidden">{department.departmentNumber ?? <span className="text-muted-foreground">–</span>}</TableCell>
                            <TableCell className="@max-3xl/table:hidden">{department.coordinator?.fullName ?? <span className="text-muted-foreground">–</span>}</TableCell>
                            <TableCell><StatusBadge active={department.active} /></TableCell>
                            <TableCell onClick={(event) => event.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="icon-row" variant="ghost" aria-label={`Akce pro středisko ${department.city}`}><IconDots /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => openDetail(department.id)}><IconLayoutSidebarRightExpand /> Otevřít detail</DropdownMenuItem>
                                        {department.active ? (
                                            <DropdownMenuItem variant="destructive" onSelect={() => askTerminate(department)}><IconBan /> Deaktivovat</DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem onSelect={() => askActivate(department)}><IconCircleCheck /> Aktivovat</DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {!needsOrganization && !loading && <TablePagination {...paginationProps} />}

            <DepartmentSheet
                open={detailId != null}
                onOpenChange={(open) => !open && closeDetail()}
                department={detail}
                isLoading={detailId != null && !detail}
                employees={employees}
                organizationId={organizationId}
                onSave={saveDepartment}
                onTerminate={() => askTerminate(detail)}
                onActivate={() => askActivate(detail)}
            />

            <DepartmentCreateDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onCreate={createAndRefresh}
                employees={employees}
                organizationId={organizationId}
            />

            <ConfirmDialog
                open={confirmAction != null}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                title={confirmAction?.type === "terminate" ? "Deaktivovat středisko?" : "Aktivovat středisko?"}
                description={confirmAction?.type === "terminate"
                    ? `Středisko ${confirmAction.department.city} jde deaktivovat, jen když nemá žádné aktivní klienty ani zaměstnance. Později ho můžete znovu aktivovat.`
                    : `Středisko ${confirmAction?.department.city} bude znovu aktivní.`}
                confirmLabel={confirmAction?.type === "terminate" ? "Deaktivovat" : "Aktivovat"}
                destructive={confirmAction?.type === "terminate"}
                onConfirm={runConfirmedAction}
            />
        </div>
    );
}

export default Departments;
