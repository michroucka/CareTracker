import React from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowRight, IconBan, IconCircleCheck, IconDots, IconFileDescription, IconLock, IconLockOpen, IconPlus, IconUserPlus } from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useClients } from "../hooks/useClients.jsx";
import { useDepartments } from "../hooks/useDepartments.jsx";
import { useEmployees } from "../hooks/useEmployees.jsx";
import { useListFilters, useMultiSelectParam } from "../hooks/useListFilters";
import { usePagedList } from "../hooks/usePagedList";
import { ROLES } from "../constants/roles.js";
import { removeDiacritics } from "../utils/formatters.js";
import { ClientAccountDialog } from "@/components/clients/ClientAccountDialog";
import { ClientTerminateDialog } from "@/components/clients/ClientTerminateDialog";
import { clientAccountState } from "@/components/clients/clientAccount";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { ListToolbar } from "@/components/data/ListToolbar";
import { TablePagination } from "@/components/data/TablePagination";
import { MultiSelectFilter } from "@/components/data/MultiSelectFilter";
import { StatusBadge } from "@/components/data/StatusBadge";
import { pluralize } from "@/components/dashboard/dashboardFormat";
import { PageHeader } from "@/components/layout/PageHeader";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pictureUrl } from "@/lib/pictures";
import { cn } from "@/lib/utils";

const EDITOR_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR];
const ADMIN_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN];

function LoadingRows({ columnCount }) {
    return Array.from({ length: 8 }, (_, index) => (
        <TableRow key={index} className="hover:bg-transparent">
            <TableCell>
                <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="grid gap-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-44" /></div>
                </div>
            </TableCell>
            {Array.from({ length: columnCount - 1 }, (_, cell) => <TableCell key={cell}><Skeleton className="h-4 w-20" /></TableCell>)}
        </TableRow>
    ));
}

function MessageRow({ columnCount, children }) {
    return (
        <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columnCount} className="py-10 text-center text-muted-foreground">{children}</TableCell>
        </TableRow>
    );
}

function Clients() {
    const navigate = useNavigate();
    const { user, superadminOrg } = useAuth();
    const canEdit = EDITOR_ROLES.includes(user.role);
    // only admins choose departments; coordinators and caregivers see their own department
    const canFilterDepartments = ADMIN_ROLES.includes(user.role);

    const { search, setSearch, statusFilter, setStatusFilter, apiStatus } = useListFilters();
    const [departmentFilter, setDepartmentFilter] = useMultiSelectParam("departments", user.role !== ROLES.SUPERADMIN && user.departmentId ? [user.departmentId] : []);
    const [caregiverFilter, setCaregiverFilter] = useMultiSelectParam("caregivers");
    const [dialog, setDialog] = React.useState(null);

    const { clients, setClients, loading, fetchClients, terminateClient, activateClient, createClientAccount, deactivateClientAccount, activateClientAccount } = useClients();
    const { departments, fetchDepartments } = useDepartments();
    const { employees, fetchEmployees } = useEmployees();

    const needsOrganization = user.role === ROLES.SUPERADMIN && !superadminOrg;
    const organizationId = superadminOrg?.id;
    const departmentIds = canFilterDepartments ? [...departmentFilter].map(Number) : [user.departmentId];

    // caregivers offered in the filter follow the department selection
    const caregiverOptions = React.useMemo(() => employees
        .filter((employee) => departmentIds.length === 0 || departmentIds.includes(employee.department?.id))
        .map((employee) => ({ value: employee.id, label: `${employee.firstName} ${employee.lastName}` })),
    // departmentIds is derived from departmentFilter
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [employees, departmentFilter, user.departmentId]);
    const caregiverIds = [...caregiverFilter].map(Number).filter((id) => caregiverOptions.some((option) => option.value === id));
    const filterKey = `${departmentIds.join(",")}|${caregiverIds.join(",")}`;

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
        // reload filter options when the organization changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId, needsOrganization]);

    React.useEffect(() => {
        if (needsOrganization) {
            setClients([]);
            return;
        }
        fetchClients({
            organizationId,
            status: apiStatus,
            departmentIds: departmentIds.length ? departmentIds : undefined,
            caregiverIds: caregiverIds.length ? caregiverIds : undefined,
        });
        // filterKey stands for departmentIds and caregiverIds
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId, apiStatus, filterKey, needsOrganization]);

    const visibleClients = React.useMemo(() => {
        const query = removeDiacritics(search.trim());
        const matching = query
            ? clients.filter((client) => removeDiacritics(`${client.firstName} ${client.lastName} ${client.lastName} ${client.firstName} ${client.city}`).includes(query))
            : clients;
        return [...matching].sort((a, b) => a.lastName.localeCompare(b.lastName, "cs") || a.firstName.localeCompare(b.firstName, "cs"));
    }, [clients, search]);

    const openDialog = (type, client) => setDialog({ type, client });
    const closeDialog = (open) => !open && setDialog(null);

    const { pageItems, tableRef, withPageReset, paginationProps } = usePagedList(visibleClients, { resetKey: organizationId });
    const count = visibleClients.length;
    const columnCount = 5 + (canEdit ? 1 : 0);
    const departmentOptions = departments.map((department) => ({ value: department.id, label: department.city }));

    return (
        <div className="grid gap-6">
            <PageHeader
                title="Klienti"
                description="Lidé, o které se vaše služba stará."
                actions={canEdit && !needsOrganization && <Button onClick={() => navigate("/clients/new")}><IconPlus /> Nový klient</Button>}
            />

            <ListToolbar
                search={search}
                onSearchChange={withPageReset(setSearch)}
                searchPlaceholder="Hledat podle jména nebo města…"
                statusFilter={statusFilter}
                onStatusFilterChange={withPageReset(setStatusFilter)}
                isLoading={loading && !needsOrganization}
                countLabel={needsOrganization ? null : `${count} ${pluralize(count, ["klient", "klienti", "klientů"])}`}
            >
                {canFilterDepartments && !needsOrganization && (
                    <MultiSelectFilter label="Středisko" allLabel="Všechna" options={departmentOptions} selected={departmentFilter} onChange={withPageReset(setDepartmentFilter)} searchPlaceholder="Hledat středisko…" />
                )}
                {!needsOrganization && (
                    <MultiSelectFilter label="Pečovatel" allLabel="Všichni" options={caregiverOptions} selected={caregiverFilter} onChange={withPageReset(setCaregiverFilter)} searchPlaceholder="Hledat pečovatele…" />
                )}
            </ListToolbar>

            <Table ref={tableRef}>
                <TableHeader>
                    <TableRow>
                        <TableHead>Klient</TableHead>
                        <TableHead className="max-md:hidden">Středisko</TableHead>
                        <TableHead className="max-sm:hidden">Pečovatel</TableHead>
                        <TableHead className="max-lg:hidden">Účet</TableHead>
                        <TableHead>Stav</TableHead>
                        {canEdit && <TableHead className="w-12"><span className="sr-only">Akce</span></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {needsOrganization ? (
                        <MessageRow columnCount={columnCount}>Nejdřív vyberte organizaci v postranním panelu.</MessageRow>
                    ) : loading ? <LoadingRows columnCount={columnCount} /> : count === 0 ? (
                        <MessageRow columnCount={columnCount}>{search ? "Žádný klient neodpovídá hledání." : "Žádní klienti pro zvolené filtry."}</MessageRow>
                    ) : pageItems.map((client) => {
                        const account = clientAccountState(client);
                        return (
                            <TableRow
                                key={client.id}
                                onClick={() => navigate(`/clients/${client.id}`)}
                                className={cn("cursor-pointer", !client.active && "text-muted-foreground")}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <PersonAvatar name={`${client.firstName} ${client.lastName}`} src={pictureUrl("clients", client.id, client.pictureId)} />
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-foreground">{client.firstName} {client.lastName}</p>
                                            <p className="truncate text-xs text-muted-foreground">{[client.street, client.city].filter(Boolean).join(", ")}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="max-md:hidden">{client.department?.city ?? "–"}</TableCell>
                                <TableCell className="max-sm:hidden">{client.caregiver?.fullName ?? <span className="text-muted-foreground">–</span>}</TableCell>
                                <TableCell className="max-lg:hidden"><Badge variant={account.variant}>{account.label}</Badge></TableCell>
                                <TableCell><StatusBadge active={client.active} /></TableCell>
                                {canEdit && (
                                    <TableCell onClick={(event) => event.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon-row" variant="ghost" aria-label={`Akce pro ${client.fullName}`}><IconDots /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => navigate(`/clients/${client.id}`)}><IconArrowRight /> Otevřít detail</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => navigate(`/clients/${client.id}/individual-plan`)}><IconFileDescription /> Individuální plán</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {client.userAccountActive == null ? (
                                                    <DropdownMenuItem onSelect={() => openDialog("createAccount", client)}><IconUserPlus /> Vytvořit účet</DropdownMenuItem>
                                                ) : client.userAccountActive ? (
                                                    <DropdownMenuItem onSelect={() => openDialog("blockAccount", client)}><IconLock /> Zablokovat účet</DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onSelect={() => activateClientAccount(client.id)}><IconLockOpen /> Odblokovat účet</DropdownMenuItem>
                                                )}
                                                {client.active ? (
                                                    <DropdownMenuItem variant="destructive" onSelect={() => openDialog("terminate", client)}><IconBan /> Ukončit smlouvu</DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onSelect={() => openDialog("activate", client)}><IconCircleCheck /> Znovu aktivovat</DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            {!needsOrganization && !loading && <TablePagination {...paginationProps} />}

            <ClientTerminateDialog open={dialog?.type === "terminate"} onOpenChange={closeDialog} client={dialog?.client} onTerminate={terminateClient} />
            <ClientAccountDialog open={dialog?.type === "createAccount"} onOpenChange={closeDialog} client={dialog?.client} onCreate={createClientAccount} />
            <ConfirmDialog
                open={dialog?.type === "blockAccount"}
                onOpenChange={closeDialog}
                title="Zablokovat účet klienta?"
                description={`${dialog?.client?.fullName ?? ""} se nebude moct přihlásit do aplikace. Účet můžete později odblokovat.`}
                confirmLabel="Zablokovat"
                destructive
                onConfirm={() => deactivateClientAccount(dialog.client.id)}
            />
            <ConfirmDialog
                open={dialog?.type === "activate"}
                onOpenChange={closeDialog}
                title="Znovu aktivovat klienta?"
                description={`${dialog?.client?.fullName ?? ""} bude znovu aktivním klientem a půjde mu zapisovat péči.`}
                confirmLabel="Aktivovat"
                onConfirm={() => activateClient(dialog.client.id)}
            />
        </div>
    );
}

export default Clients;
