import React from "react";
import { IconBan, IconCircleCheck, IconDots, IconLayoutSidebarRightExpand, IconMailForward, IconPlus } from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useDepartments } from "../hooks/useDepartments.jsx";
import { useEmployees } from "../hooks/useEmployees.jsx";
import { useDetailParam } from "../hooks/useDetailParam";
import { useListFilters, useMultiSelectParam } from "../hooks/useListFilters";
import { usePagedList } from "../hooks/usePagedList";
import { getRoleLabel, ROLES } from "../constants/roles.js";
import { removeDiacritics } from "../utils/formatters.js";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { TableEmptyRow } from "@/components/data/EmptyState";
import { TableLoadingRows } from "@/components/data/TableLoadingRows";
import { ListToolbar } from "@/components/data/ListToolbar";
import { TablePagination } from "@/components/data/TablePagination";
import { MultiSelectFilter } from "@/components/data/MultiSelectFilter";
import { StatusBadge } from "@/components/data/StatusBadge";
import { pluralize } from "@/components/dashboard/dashboardFormat";
import { EmployeeCreateDialog } from "@/components/employees/EmployeeCreateDialog";
import { EmployeeSheet } from "@/components/employees/EmployeeSheet";
import { accountState } from "@/components/employees/employeeForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { errorAlreadyShown } from "@/utils/errorHandler";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pictureUrl } from "@/lib/pictures";
import { cn } from "@/lib/utils";

const EDITOR_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR];
const ADMIN_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN];

function Employees() {
    const { user, superadminOrg } = useAuth();
    const canEdit = EDITOR_ROLES.includes(user.role);
    const canManageAdmins = ADMIN_ROLES.includes(user.role);
    const canChange = (employee) => canEdit && (canManageAdmins || !employee?.isAdmin);
    // only admins choose departments; coordinators and caregivers see their own department
    const canFilterDepartments = ADMIN_ROLES.includes(user.role);

    const { search, setSearch, statusFilter, setStatusFilter, apiStatus } = useListFilters();
    const [departmentFilter, setDepartmentFilter] = useMultiSelectParam("departments", canFilterDepartments && user.departmentId ? [user.departmentId] : []);
    const { detailId, openDetail, closeDetail } = useDetailParam();
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [confirmAction, setConfirmAction] = React.useState(null);
    const [detail, setDetail] = React.useState(null);

    const { employees, setEmployees, loading, fetchEmployees, fetchEmployee, createEmployee, updateEmployee, terminateEmployee, activateEmployee, resendActivationEmail } = useEmployees();
    const { departments, fetchDepartments } = useDepartments();

    const needsOrganization = user.role === ROLES.SUPERADMIN && !superadminOrg;
    const organizationId = superadminOrg?.id;
    const status = canEdit ? apiStatus : true;
    const departmentIds = canFilterDepartments ? [...departmentFilter].map(Number) : [user.departmentId];
    const departmentKey = departmentIds.join(",");

    // a different organization has different departments, start from all of them
    const previousOrganizationId = React.useRef(organizationId);
    React.useEffect(() => {
        if (previousOrganizationId.current !== organizationId) setDepartmentFilter(new Set());
        previousOrganizationId.current = organizationId;
    }, [organizationId, setDepartmentFilter]);

    React.useEffect(() => {
        if (needsOrganization) return;
        fetchDepartments({ organizationId, status: true });
        // reload departments when the organization changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId, needsOrganization]);

    const loadEmployees = React.useCallback((options) => {
        fetchEmployees({ organizationId, status, departmentIds }, options);
        // departmentKey stands for departmentIds
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId, status, departmentKey]);

    React.useEffect(() => {
        if (needsOrganization) {
            setEmployees([]);
            return;
        }
        loadEmployees();
    }, [loadEmployees, needsOrganization, setEmployees]);

    React.useEffect(() => {
        setDetail(null);
        if (!detailId) return;
        fetchEmployee(detailId).then(setDetail).catch(closeDetail);
        // load whenever another employee is opened
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailId]);

    const visibleEmployees = React.useMemo(() => {
        const query = removeDiacritics(search.trim());
        if (!query) return employees;
        return employees.filter((employee) => removeDiacritics(`${employee.firstName} ${employee.lastName} ${employee.lastName} ${employee.firstName}`).includes(query));
    }, [employees, search]);

    const reloadDetail = async (id) => {
        if (detail?.id === id) setDetail(await fetchEmployee(id));
    };

    const runConfirmedAction = async () => {
        const { type, employee } = confirmAction;
        if (type === "terminate") await terminateEmployee(employee.id);
        else await activateEmployee(employee.id);
        await reloadDetail(employee.id);
    };

    const saveEmployee = async (id, request) => {
        await updateEmployee(id, request);
        await reloadDetail(id);
    };

    const createAndReload = async (request) => {
        await createEmployee(request);
        loadEmployees({ silent: true });
    };

    const { pageItems, tableRef, withPageReset, paginationProps } = usePagedList(visibleEmployees, { resetKey: organizationId });
    const count = visibleEmployees.length;
    const columnCount = 4 + (canEdit ? 2 : 0);
    const departmentOptions = departments.map((department) => ({ value: department.id, label: department.city }));
    const fullName = (employee) => `${employee.firstName} ${employee.lastName}`;

    return (
        <div className="grid gap-6">
            <PageHeader
                title="Zaměstnanci"
                description={canFilterDepartments ? "Pečovatelé, koordinátoři a vedení organizace." : "Kolegové z vašeho střediska."}
                actions={canEdit && !needsOrganization && <Button onClick={() => setIsCreateOpen(true)}><IconPlus /> Nový zaměstnanec</Button>}
            />

            <ListToolbar
                search={search}
                onSearchChange={withPageReset(setSearch)}
                searchPlaceholder="Hledat podle jména…"
                statusFilter={canEdit ? statusFilter : null}
                onStatusFilterChange={withPageReset(setStatusFilter)}
                isLoading={loading && !needsOrganization}
                countLabel={needsOrganization ? null : `${count} ${pluralize(count, ["zaměstnanec", "zaměstnanci", "zaměstnanců"])}`}
            >
                {canFilterDepartments && !needsOrganization && (
                    <MultiSelectFilter
                        label="Středisko"
                        allLabel="Všechna"
                        options={departmentOptions}
                        selected={departmentFilter}
                        onChange={withPageReset(setDepartmentFilter)}
                        searchPlaceholder="Hledat středisko…"
                    />
                )}
            </ListToolbar>

            <Table ref={tableRef}>
                <TableHeader>
                    <TableRow>
                        <TableHead>Jméno</TableHead>
                        <TableHead className="@max-xl/table:hidden">Role</TableHead>
                        <TableHead className="@max-3xl/table:hidden">Středisko</TableHead>
                        <TableHead className="@max-4xl/table:hidden">Účet</TableHead>
                        {canEdit && <TableHead>Stav</TableHead>}
                        {canEdit && <TableHead className="w-12"><span className="sr-only">Akce</span></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {needsOrganization ? (
                        <TableEmptyRow columnCount={columnCount} title="Vyberte organizaci" description="Organizaci přepnete v postranním panelu." />
                    ) : loading ? <TableLoadingRows avatar columns={["", "@max-xl/table:hidden", "@max-3xl/table:hidden", "@max-4xl/table:hidden", ...(canEdit ? ["", null] : [])]} /> : count === 0 ? (
                        (search
                        ? <TableEmptyRow columnCount={columnCount} title="Nikdo neodpovídá hledání" description="Zkuste jiné jméno." action={<Button variant="outline" size="sm" onClick={() => setSearch("")}>Zrušit hledání</Button>} />
                        : <TableEmptyRow columnCount={columnCount} title="Žádní zaměstnanci" description="Pro zvolený stav a středisko tu nikdo není." />)
                    ) : pageItems.map((employee) => {
                        const account = accountState(employee);
                        const isSelf = employee.id === user.employeeId;
                        return (
                            <TableRow
                                key={employee.id}
                                data-state={employee.id === detailId ? "selected" : undefined}
                                onClick={() => openDetail(employee.id)}
                                className={cn("cursor-pointer", !employee.active && "text-muted-foreground")}
                            >
                                <TableCell className="w-full max-w-0">
                                    <div className="flex items-center gap-3">
                                        <PersonAvatar name={`${employee.firstName} ${employee.lastName}`} src={pictureUrl("employees", employee.id, employee.pictureId)} />
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-foreground">{fullName(employee)}{isSelf && <span className="font-normal text-muted-foreground"> (vy)</span>}</p>
                                            {employee.email && <p className="truncate text-xs text-muted-foreground">{employee.email}</p>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="@max-xl/table:hidden">{getRoleLabel(employee.role)}{employee.isAdmin && <Badge variant="secondary" className="ml-2">Admin</Badge>}</TableCell>
                                <TableCell className="@max-3xl/table:hidden">{employee.department?.city ?? "–"}</TableCell>
                                <TableCell className="@max-4xl/table:hidden"><Badge variant={account.variant}>{account.label}</Badge></TableCell>
                                {canEdit && <TableCell><StatusBadge active={employee.active} /></TableCell>}
                                {canEdit && (
                                    <TableCell onClick={(event) => event.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon-row" variant="ghost" aria-label={`Akce pro ${fullName(employee)}`}><IconDots /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => openDetail(employee.id)}><IconLayoutSidebarRightExpand /> Otevřít detail</DropdownMenuItem>
                                                {canChange(employee) && employee.email && !employee.isActivated && (
                                                    <DropdownMenuItem onSelect={() => resendActivationEmail(employee.id).catch(errorAlreadyShown)}><IconMailForward /> Znovu poslat aktivační e-mail</DropdownMenuItem>
                                                )}
                                                {canChange(employee) && (employee.active ? (
                                                    <DropdownMenuItem variant="destructive" disabled={isSelf} onSelect={() => setConfirmAction({ type: "terminate", employee })}><IconBan /> Deaktivovat</DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onSelect={() => setConfirmAction({ type: "activate", employee })}><IconCircleCheck /> Aktivovat</DropdownMenuItem>
                                                ))}
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

            <EmployeeSheet
                open={detailId != null}
                onOpenChange={(open) => !open && closeDetail()}
                employee={detail}
                isLoading={detailId != null && !detail}
                canEdit={canChange(detail)}
                canManageAdmins={canManageAdmins}
                isSelf={detail?.id === user.employeeId}
                organizationId={organizationId}
                departments={departments}
                onSave={saveEmployee}
                onTerminate={() => setConfirmAction({ type: "terminate", employee: detail })}
                onActivate={() => setConfirmAction({ type: "activate", employee: detail })}
                onResendActivation={() => resendActivationEmail(detail.id).catch(errorAlreadyShown)}
            />

            {canEdit && (
                <EmployeeCreateDialog
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                    onCreate={createAndReload}
                    departments={departments}
                    defaultDepartmentId={user.departmentId}
                    canManageAdmins={canManageAdmins}
                />
            )}

            <ConfirmDialog
                open={confirmAction != null}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                title={confirmAction?.type === "terminate" ? "Deaktivovat zaměstnance?" : "Aktivovat zaměstnance?"}
                description={confirmAction?.type === "terminate"
                    ? `${fullName(confirmAction.employee)} se deaktivuje a zablokuje se i jeho účet v aplikaci. Později ho můžete znovu aktivovat.`
                    : `${confirmAction ? fullName(confirmAction.employee) : ""} bude znovu aktivní.`}
                confirmLabel={confirmAction?.type === "terminate" ? "Deaktivovat" : "Aktivovat"}
                destructive={confirmAction?.type === "terminate"}
                onConfirm={runConfirmedAction}
            />
        </div>
    );
}

export default Employees;
