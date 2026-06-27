import React from "react";
import {
    Button,
    Dropdown,
    Label,
    Separator,
    TextField,
    InputGroup,
    Spinner,
    Table,
} from "@heroui/react";
import {ChevronDown, Funnel, Mail, MoreVertical, Plus, Search, Send, UserRound, UserRoundCheck, UserRoundX} from "lucide-react";
import {useDepartments} from "../hooks/useDepartments.jsx";
import {useEmployees} from "../hooks/useEmployees.jsx";
import {useIsMobile} from "../hooks/useMediaQuery.js";
import {SortableColumnHeader} from "../components/SortableColumnHeader.jsx";
import {activeOptions} from "../constants/globalConstants.js";
import {useAuth} from "../contexts/AuthContext.tsx";
import {removeDiacritics} from "../utils/formatters.js";
import {sortByKey} from "../utils/sorting.js";
import {ROLE_LABELS} from "../constants/roles.js";
import {EmployeeCreateModal} from "../components/modals/employee/EmployeeCreateModal.jsx";
import {EmployeeDetailModal} from "../components/modals/employee/EmployeeDetailModal.jsx";
import {EmployeeTerminateModal} from "../components/modals/employee/EmployeeTerminateModal.jsx";
import {FiltersModal} from "../components/modals/FiltersModal.jsx";
import {useSearchParams} from "react-router-dom";

function Employees() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, superadminOrg } = useAuth();

    const getInitialFilterValue = () => searchParams.get("search") || "";
    const getInitialActiveFilter = () => {
        const status = searchParams.get("status");
        if (status === null) return new Set(["true"]);
        if (status === "all") return new Set(["true", "false"]);
        return new Set([status]);
    };
    const getInitialDepartmentFilter = () => {
        const depts = searchParams.get("departments");
        if (!depts) return new Set(["all"]);
        return depts === "all" ? new Set(["all"]) : new Set(depts.split(","));
    };

    const [filterValue, setFilterValue] = React.useState(getInitialFilterValue);
    const [activeFilter, setActiveFilter] = React.useState(getInitialActiveFilter);
    const [departmentFilter, setDepartmentFilter] = React.useState(getInitialDepartmentFilter);
    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "fullName",
        direction: "ascending",
    });
    const {
        employees,
        setEmployees,
        loading,
        fetchEmployees,
        fetchEmployee,
        createEmployee,
        updateEmployee,
        terminateEmployee,
        activateEmployee,
        resendActivationEmail
    } = useEmployees();
    const { departments, fetchDepartments } = useDepartments();
    const hasLoadedMetadata = React.useRef(false);
    const [ isCreateModalOpen, setIsCreateModalOpen ] = React.useState(false);
    const [ isDetailModalOpen, setIsDetailModalOpen ] = React.useState(false);
    const [ isTerminateModalOpen, setIsTerminateModalOpen ] = React.useState(false);
    const [ selectedEmployee, setSelectedEmployee ] = React.useState(null);
    const [ isLoadingDetail, setIsLoadingDetail ] = React.useState(false);
    const [ isFiltersModalOpen, setIsFiltersModalOpen ] = React.useState(false);

    const columns = [
        {name: "JMÉNO", key: "fullName", sortable: true},
        {name: "ROLE", key: "role"},
        {name: "STŘEDISKO", key: "department"},
        {name: "AKCE", key: "actions"},
    ];

    const isMobile = useIsMobile();

    const canAlterEmployee = React.useMemo(() => {
        if (!user) return false;
        const allowedRoles = ["SUPERADMIN", "ADMIN", "COORDINATOR"];

        return allowedRoles.includes(user.role);
    }, [user]);

    const visibleColumns = React.useMemo(() => {
        if (isMobile) {
            return columns.filter(col => col.key === "fullName" || col.key === "actions");
        }
        return columns;
    }, [isMobile]);

    const hasSearchFilter = Boolean(filterValue);

    const departmentOptions = React.useMemo(() => {
        return departments.map(dept => ({
            name: dept.city,
            key: dept.city
        }));
    }, [departments]);

    const filteredItems = React.useMemo(() => {
        let filteredEmployees = [...employees];

        if (hasSearchFilter) {
            const normalizedSearchValue = removeDiacritics(filterValue);
            filteredEmployees = filteredEmployees.filter((employee) =>
                removeDiacritics(employee.fullName).includes(normalizedSearchValue),
            );
        }

        return filteredEmployees;
    }, [employees, filterValue, hasSearchFilter]);

    const sortedItems = React.useMemo(() => {
        return sortByKey(filteredItems, sortDescriptor.column, sortDescriptor.direction);
    }, [sortDescriptor, filteredItems]);

    const onSearchChange = React.useCallback((value) => {
        if (value) {
            setFilterValue(value);
        } else {
            setFilterValue("");
        }
    }, []);

    const onClear = React.useCallback(() => {
        setFilterValue("");
    }, []);

    const handleDepartmentFilterChange = React.useCallback((keys) => {
        const newKeys = new Set(keys);

        if (newKeys.has("all") && !departmentFilter.has("all")) {
            setDepartmentFilter(new Set(["all"]));
        }
        else if (newKeys.size > 1 && newKeys.has("all")) {
            newKeys.delete("all");
            setDepartmentFilter(newKeys);
        }
        else if (newKeys.size === 0) {
            setDepartmentFilter(new Set(["all"]));
        }
        else {
            setDepartmentFilter(newKeys);
        }
    }, [departmentFilter]);


    React.useEffect(() => {
        if (!user || hasLoadedMetadata.current) return;
        if (user.role === "SUPERADMIN") return;

        hasLoadedMetadata.current = true;
        fetchDepartments({ status: "true" });
    }, [user]);

    React.useEffect(() => {
        if (user?.role !== "SUPERADMIN") return;
        if (!superadminOrg) {
            setEmployees([]);
            return;
        }
        fetchDepartments({ organizationId: superadminOrg.id, status: "true" });
    }, [user, superadminOrg]);

    React.useEffect(() => {
        if (!user) return;

        const allowedToSeeInactive = ["SUPERADMIN", "ADMIN", "COORDINATOR"].includes(user.role);

        if (!allowedToSeeInactive && !activeFilter.has("true")) {
            setActiveFilter(new Set(["true"]));
        }
        if (!allowedToSeeInactive && activeFilter.size === 2) {
            setActiveFilter(new Set(["true"]));
        }
    }, [user]);

    React.useEffect(() => {
        // Set default department filter for COORDINATOR/CAREGIVER only once, and only when the URL
        // does not already contain a specific department selection (to preserve bookmarked state)
        const urlDepartments = searchParams.get("departments");
        if (user?.departmentId && departments.length > 0 && departmentFilter.has("all") && (!urlDepartments || urlDepartments === "all")) {
            const userDepartment = departments.find(dept => dept.id === user.departmentId);
            if (userDepartment) {
                setDepartmentFilter(new Set([userDepartment.city]));
            }
        }
    }, [user, departments]);

    React.useEffect(() => {
        if (!user) return;

        const params = new URLSearchParams();
        const allowedToSeeInactive = ["SUPERADMIN", "ADMIN", "COORDINATOR"].includes(user.role);
        const allowedToFilterDepartment = !['CAREGIVER', 'COORDINATOR'].includes(user.role);

        if (filterValue) {
            params.set("search", filterValue);
        }

        if (allowedToSeeInactive) {
            if (activeFilter.size === 2) {
                params.set("status", "all");
            } else if (activeFilter.has("true")) {
                params.set("status", "true");
            } else if (activeFilter.has("false")) {
                params.set("status", "false");
            }
        }

        const shouldSaveFilters = user.role !== "SUPERADMIN" || !!superadminOrg;

        if (allowedToFilterDepartment && shouldSaveFilters) {
            if (!departmentFilter.has("all")) {
                params.set("departments", Array.from(departmentFilter).join(","));
            } else {
                params.set("departments", "all");
            }
        }

        setSearchParams(params, { replace: true });
    }, [filterValue, activeFilter, departmentFilter, user, superadminOrg]);

    const prevSuperadminOrgId = React.useRef(superadminOrg?.id);
    React.useEffect(() => {
        if (user?.role !== "SUPERADMIN") return;

        if (prevSuperadminOrgId.current !== superadminOrg?.id) {
            setDepartmentFilter(new Set(["all"]));
        }

        prevSuperadminOrgId.current = superadminOrg?.id;
    }, [user, superadminOrg]);

    React.useEffect(() => {
        if (user?.role === "SUPERADMIN") {
            if (!superadminOrg) return;
            if (departments.length === 0) return;
        } else {
            if (departments.length === 0) return;
        }

        const filters = {
            organizationId: superadminOrg?.id,
            status: getStatusFromFilter(activeFilter),
            departmentIds: getDepartmentIdsFromFilter(departmentFilter, departments)
        };

        fetchEmployees(filters);
    }, [superadminOrg, activeFilter, departmentFilter, user, departments]);

    function getStatusFromFilter(activeFilter) {
        if (activeFilter.size === 0 || activeFilter.size === 2) {
            return undefined;
        }
        return activeFilter.has("true");
    }

    function getDepartmentIdsFromFilter(departmentFilter, departments) {
        if (departmentFilter.has("all")) {
            return undefined;
        }
        return departments
            .filter(dept => departmentFilter.has(dept.city))
            .map(dept => dept.id);
    }

    async function handleSelectEmployee(employeeId) {
        try {
            const employeeData = await fetchEmployee(employeeId);
            setSelectedEmployee(employeeData);
        } catch (error) {
            console.error("Failed to load employee:", error);
            throw error;
        }
    }

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    }

    const handleCreateEmployee = async (employeeData) => {
        try {
            await createEmployee(employeeData);
            handleCloseCreateModal();
        } catch (error) {
            console.error("Failed to create employee: ", error);
            throw error;
        }
    }

    const handleUpdateEmployee = async (employeeId, employeeData) => {
        try {
            return await updateEmployee(employeeId, employeeData);
        } catch (error) {
            console.error("Failed to update employee:", error);
            throw error;
        }
    }

    const handleOpenDetailModal = async (employeeId) => {
        setIsLoadingDetail(true);
        setIsDetailModalOpen(true);

        try {
            await handleSelectEmployee(employeeId);
        } catch {
            setIsDetailModalOpen(false);
        }

        setIsLoadingDetail(false);
    }

    const handleCloseDetailModal = () => {
        setSelectedEmployee(null);
        setIsDetailModalOpen(false);
    }

    const handleOpenTerminateModal = async (employeeId) => {
        setIsTerminateModalOpen(true);

        try {
            await handleSelectEmployee(employeeId);
        } catch {
            setIsTerminateModalOpen(false);
        }
    }

    const handleCloseTerminateModal = () => {
        setSelectedEmployee(null);
        setIsTerminateModalOpen(false);
    }

    const handleTerminateEmployee = async (employeeId, data) => {
        try {
            await terminateEmployee(employeeId, data);
        } catch (error) {
            console.error("Failed to terminate employee:", error);
            throw error;
        }
    }

    const handleActivateEmployee = async (employeeId) => {
        try {
            await activateEmployee(employeeId);
        } catch (error) {
            console.error("Failed to activate employee:", error);
            throw error;
        }
    }

    const handleOpenFiltersModal = () => {
        setIsFiltersModalOpen(true);
    };

    const handleCloseFiltersModal = () => {
        setIsFiltersModalOpen(false);
    }

    const handleFiltersChange = React.useCallback((filters) => {
        setActiveFilter(filters.activeFilter);
        setDepartmentFilter(filters.departmentFilter);
    }, []);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <TextField
                        className="w-full sm:max-w-[44%]"
                    >
                        <InputGroup>
                            <InputGroup.Prefix><Search className="size-5 opacity-50" /></InputGroup.Prefix>
                            <InputGroup.Input
                                placeholder="Hledat podle jména..."
                                value={filterValue}
                                onChange={(e) => onSearchChange(e.target.value)}
                                isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                            />
                        </InputGroup>
                    </TextField>
                    <div className="flex gap-3">
                        <Button
                            isIconOnly
                            variant="tertiary"
                            className="sm:hidden"
                            onPress={handleOpenFiltersModal}
                        >
                            <Funnel className="size-4" />
                        </Button>
                        {canAlterEmployee && (
                            <Dropdown>
                                <Button
                                    variant="tertiary"
                                    className="hidden sm:flex text-foreground"
                                    isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                                >Status <ChevronDown
                                        className="size-4" /></Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        disallowEmptySelection
                                        aria-label="Active Filter"
                                        closeOnSelect={false}
                                        selectedKeys={activeFilter}
                                        selectionMode="multiple"
                                        onSelectionChange={setActiveFilter}
                                        className="max-h-60 overflow-y-auto"
                                    >
                                        {activeOptions.map((active) => (
                                            <Dropdown.Item key={active.key} id={active.key} textValue={active.name}>
                                                <Dropdown.ItemIndicator />
                                                <Label>{active.name}</Label>
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}

                        {!['CAREGIVER', 'COORDINATOR'].includes(user.role) && (
                            <Dropdown>
                                <Button
                                    variant="tertiary"
                                    className="hidden sm:flex text-foreground"
                                    isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                                >Středisko <ChevronDown className="size-4" /></Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        disallowEmptySelection
                                        aria-label="Department Filter"
                                        closeOnSelect={false}
                                        selectedKeys={departmentFilter}
                                        selectionMode="multiple"
                                        onSelectionChange={handleDepartmentFilterChange}
                                        className="max-h-60 overflow-y-auto"
                                    >
                                        <Dropdown.Item id="all" textValue="Všechny">
                                            <Dropdown.ItemIndicator />
                                            <Label>Všechny</Label>
                                        </Dropdown.Item>
                                        {departmentOptions.map((dept) => (
                                            <Dropdown.Item key={dept.key} id={dept.key} textValue={dept.name}>
                                                <Dropdown.ItemIndicator />
                                                <Label>{dept.name}</Label>
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}

                        {canAlterEmployee && (
                            <Button variant="primary"
                                    onPress={handleOpenCreateModal}
                                    isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                            >Přidat <Plus className="size-4" /></Button>
                        )}
                    </div>
                </div>
                <div className="flex flex-row justify-start items-center mb-4">
                    <span className="text-sm">Celkem {filteredItems.length} {filteredItems.length === 1 ? "zaměstnanec" : filteredItems.length >= 2 && filteredItems.length <= 4 ? "zaměstnanci" : "zaměstnanců"}</span>
                </div>
            </div>
        );
    }, [
        filterValue,
        activeFilter,
        departmentFilter,
        filteredItems.length,
        employees.length,
        onSearchChange,
        onClear,
        activeOptions,
        departmentOptions,
        handleDepartmentFilterChange,
        handleOpenFiltersModal,
        canAlterEmployee,
        user,
        superadminOrg,
    ]);

    const renderCell = React.useCallback((employee, columnKey) => {
        const cellValue = employee[columnKey];

        switch (columnKey) {
            case "fullName":
                return (
                    <div className="flex flex-col">
                        <p className="font-bold text-sm">{cellValue}</p>
                    </div>
                );
            case "role":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{ROLE_LABELS[cellValue]}</p>
                    </div>
                );
            case "department":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{cellValue?.city || "-"}</p>
                    </div>
                );
            case "actions":
                return (
                    <div className="relative flex justify-end items-center gap-2">
                        <Dropdown>
                            <Button isIconOnly size="sm" variant="ghost">
                                <MoreVertical size={20} />
                            </Button>
                            <Dropdown.Popover>
                                <Dropdown.Menu>
                                    <Dropdown.Section>
                                        <Dropdown.Item id="view"
                                                       textValue={isLoadingDetail ? "Načítání..." : "Detail"}
                                                       onAction={() => handleOpenDetailModal(employee.id)}
                                        >
                                            <UserRound />
                                            <Label>{isLoadingDetail ? "Načítání..." : "Detail"}</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Section>

                                    {canAlterEmployee ? (
                                        <>
                                            <Separator />
                                            <Dropdown.Section>
                                                {!employee.isActivated && employee.email ? (
                                                    <Dropdown.Item id="resend"
                                                                   textValue="Poslat aktivační email"
                                                                   onAction={() => resendActivationEmail(employee.id)}
                                                    >
                                                        <Mail />
                                                        <Label>Poslat aktivační email</Label>
                                                    </Dropdown.Item>
                                                ) : null }
                                                {employee.active ? (
                                                    <Dropdown.Item id="terminate"
                                                                   textValue="Deaktivovat"
                                                                   variant="danger"
                                                                   isDisabled={employee.id === user?.employeeId}
                                                                   onAction={() => handleOpenTerminateModal(employee.id)}
                                                    >
                                                        <UserRoundX />
                                                        <Label>Deaktivovat</Label>
                                                    </Dropdown.Item>
                                                ) : (
                                                    <Dropdown.Item id="activate"
                                                                   textValue="Aktivovat"
                                                                   className="text-success"
                                                                   onAction={() => handleActivateEmployee(employee.id)}
                                                    >
                                                        <UserRoundCheck />
                                                        <Label>Aktivovat</Label>
                                                    </Dropdown.Item>
                                                )}
                                            </Dropdown.Section>
                                        </>
                                    ) : null}
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>
                    </div>
                );
            default:
                return cellValue || "-";
        }
    }, [canAlterEmployee]);

    const isSuperadminWithoutOrg = user?.role === "SUPERADMIN" && !superadminOrg;
    const shouldShowLoading = !isSuperadminWithoutOrg && loading;

    return (
        <>
            {topContent}
            <Table variant="secondary">
                <Table.ScrollContainer>
                    <Table.Content
                        aria-label="Employees table"
                        sortDescriptor={sortDescriptor}
                        onSortChange={setSortDescriptor}
                    >
                        <Table.Header columns={visibleColumns}>
                            {(column) => (
                                <Table.Column
                                    key={column.key}
                                    id={column.key}
                                    className={column.key === "actions" ? "text-end" : ""}
                                    allowsSorting={column.sortable}
                                    isRowHeader={column.key === "fullName"}
                                >
                                    {column.sortable
                                        ? ({ sortDirection }) => (
                                            <SortableColumnHeader sortDirection={sortDirection}>{column.name}</SortableColumnHeader>
                                        )
                                        : column.name}
                                </Table.Column>
                            )}
                        </Table.Header>
                        <Table.Body
                            items={shouldShowLoading ? [] : sortedItems}
                            renderEmptyState={() => (
                                shouldShowLoading ? (
                                    <div className="flex flex-col items-center gap-2 mt-72">
                                        <Spinner />
                                        <p className="text-sm text-foreground/60">Načítání zaměstnanců...</p>
                                    </div>
                                ) : (
                                    <p>
                                        {isSuperadminWithoutOrg
                                            ? "Vyberte prosím organizaci v navigační liště" : "Žádní zaměstnanci nenalezeni"}
                                    </p>
                                )
                            )}
                        >
                            {(item) => (
                                <Table.Row key={item.id} id={item.id} columns={visibleColumns} className={!item.active ? "opacity-50" : ""}>
                                    {(column) =>
                                        <Table.Cell className="py-1">
                                            {renderCell(item, column.key)}
                                        </Table.Cell>
                                    }
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>

            <EmployeeCreateModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onSubmit={handleCreateEmployee}
                userDept={user?.departmentId}
                userRole={user?.role}
                departments={departments}
            />

            <EmployeeDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                onSubmit={handleUpdateEmployee}
                canEdit={canAlterEmployee}
                userRole={user?.role}
                employee={selectedEmployee}
                isLoading={isLoadingDetail}
                departments={departments}
            />

            <EmployeeTerminateModal
                isOpen={isTerminateModalOpen}
                onClose={handleCloseTerminateModal}
                onSubmit={handleTerminateEmployee}
                employeeId={selectedEmployee?.id}
                employeeName={`${selectedEmployee?.firstName} ${selectedEmployee?.lastName}`}
            />

            <FiltersModal
                isOpen={isFiltersModalOpen}
                onClose={handleCloseFiltersModal}
                onSubmit={handleFiltersChange}
                user={user}
                superadminOrgSelected={!!superadminOrg}
                showStatusFilter={canAlterEmployee}
                initialActiveFilter={activeFilter}
                initialDepartmentFilter={departmentFilter}
                activeOptions={activeOptions}
                departmentOptions={departmentOptions}
            />
        </>
    );
}

export default Employees;

