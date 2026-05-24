import React from "react";
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu, DropdownSection,
    DropdownTrigger,
    Input,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/react";
import {ChevronDown, Funnel, Mail, MoreVertical, Plus, Search, Send, UserRound, UserRoundCheck, UserRoundX} from "lucide-react";
import {useDepartments} from "../hooks/useDepartments.jsx";
import {useEmployees} from "../hooks/useEmployees.jsx";
import {useIsMobile} from "../hooks/useMediaQuery.js";
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
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%]"
                        placeholder="Hledat podle jména..."
                        startContent={<Search className="size-5" />}
                        value={filterValue}
                        onClear={() => onClear()}
                        onValueChange={onSearchChange}
                    />
                    <div className="flex gap-3">
                        <Button
                            isIconOnly
                            variant="flat"
                            className="sm:hidden"
                            onPress={handleOpenFiltersModal}
                        >
                            <Funnel className="size-4" />
                        </Button>
                        {canAlterEmployee && (
                            <Dropdown>
                                <DropdownTrigger className="hidden sm:flex">
                                    <Button
                                        endContent={<ChevronDown
                                            className="size-4" />}
                                        variant="flat"
                                        className="text-foreground"
                                        isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                                    >
                                        Status
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    disallowEmptySelection
                                    aria-label="Active Filter"
                                    closeOnSelect={false}
                                    selectedKeys={activeFilter}
                                    selectionMode="multiple"
                                    onSelectionChange={setActiveFilter}
                                    className="max-h-60 overflow-y-auto"
                                >
                                    {activeOptions.map((active) => (
                                        <DropdownItem key={active.key}>
                                            {active.name}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        )}

                        {!['CAREGIVER', 'COORDINATOR'].includes(user.role) && (
                            <Dropdown>
                                <DropdownTrigger className="hidden sm:flex">
                                    <Button
                                        endContent={<ChevronDown className="size-4" />}
                                        variant="flat"
                                        className="text-foreground"
                                        isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                                    >
                                        Středisko
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    disallowEmptySelection
                                    aria-label="Department Filter"
                                    closeOnSelect={false}
                                    selectedKeys={departmentFilter}
                                    selectionMode="multiple"
                                    onSelectionChange={handleDepartmentFilterChange}
                                    className="max-h-60 overflow-y-auto"
                                >
                                    <DropdownItem key="all">Všechny</DropdownItem>
                                    {departmentOptions.map((dept) => (
                                        <DropdownItem key={dept.key}>
                                            {dept.name}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        )}

                        {canAlterEmployee && (
                            <Button color="primary"
                                    endContent={<Plus className="size-4" />}
                                    onPress={handleOpenCreateModal}
                            >
                                Přidat
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex flex-row justify-start items-center">
                    <span className="text-small">Celkem {filteredItems.length} {filteredItems.length === 1 ? "zaměstnanec" : filteredItems.length >= 2 && filteredItems.length <= 4 ? "zaměstnanci" : "zaměstnanců"}</span>
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
                        <p className="font-bold text-small">{cellValue}</p>
                    </div>
                );
            case "role":
                return (
                    <div className="flex flex-col">
                        <p className="text-small">{ROLE_LABELS[cellValue]}</p>
                    </div>
                );
            case "department":
                return (
                    <div className="flex flex-col">
                        <p className="text-small">{cellValue?.city || "-"}</p>
                    </div>
                );
            case "actions":
                return (
                    <div className="relative flex justify-end items-center gap-2">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <MoreVertical size={20} />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownSection showDivider={canAlterEmployee}>
                                    <DropdownItem key="view"
                                                  startContent={<UserRound />}
                                                  variant="light"
                                                  isLoading={isLoadingDetail}
                                                  onPress={() => handleOpenDetailModal(employee.id)}
                                    >
                                        {isLoadingDetail ? "Načítání..." : "Detail"}
                                    </DropdownItem>
                                </DropdownSection>

                                {canAlterEmployee ? (
                                    <DropdownSection>
                                        {!employee.isActivated && employee.email ? (
                                            <DropdownItem key="resend"
                                                          startContent={<Mail />}
                                                          variant="light"
                                                          onPress={() => resendActivationEmail(employee.id)}
                                            >
                                                Poslat aktivační email
                                            </DropdownItem>
                                        ) : null }
                                        {employee.active ? (
                                            <DropdownItem key="terminate"
                                                          startContent={<UserRoundX />}
                                                          variant="light"
                                                          color="danger"
                                                          isDisabled={employee.id === user?.employeeId}
                                                          onPress={() => handleOpenTerminateModal(employee.id)}
                                            >
                                                Deaktivovat
                                            </DropdownItem>
                                        ) : (
                                            <DropdownItem key="activate"
                                                          startContent={<UserRoundCheck />}
                                                          variant="light"
                                                          color="success"
                                                          onPress={() => handleActivateEmployee(employee.id)}
                                            >
                                                Aktivovat
                                            </DropdownItem>
                                        )}
                                    </DropdownSection>
                                ) : null}
                            </DropdownMenu>
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
            <Table
                isHeaderSticky
                removeWrapper
                                aria-label="Employees table"
                sortDescriptor={sortDescriptor}
                topContent={topContent}
                topContentPlacement="outside"
                onSortChange={setSortDescriptor}
            >
                <TableHeader columns={visibleColumns}>
                    {(column) => (
                        <TableColumn
                            key={column.key}
                            align={column.key === "actions" ? "end" : "start"}
                            allowsSorting={column.sortable}
                        >
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    isLoading={shouldShowLoading}
                    loadingContent={<Spinner className="mt-72" label="Načítání zaměstnanců..." />}
                    emptyContent={
                        isSuperadminWithoutOrg
                            ? "Vyberte prosím organizaci v navigační liště" : "Žádní zaměstnanci nenalezeni"
                    }
                    items={sortedItems}>
                    {(item) => (
                        <TableRow key={item.id} className={!item.active ? "opacity-50" : ""}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
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

