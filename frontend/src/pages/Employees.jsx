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
import {ChevronDown, MoreVertical, Plus, Search, UserRound, UserRoundCheck, UserRoundX} from "lucide-react";
import {useDepartments} from "../hooks/useDepartments.jsx";
import {useEmployees} from "../hooks/useEmployees.jsx";
import {useOrganizations} from "../hooks/useOrganizations.jsx";
import {useIsMobile} from "../hooks/useMediaQuery.js";
import {columns, activeOptions} from '../constants/employeeConstants.js';
import {useAuth} from "../contexts/AuthContext.tsx";
import {removeDiacritics} from "../utils/formatters.js";
import {sortByKey} from "../utils/sorting.js";
import {ROLE_LABELS} from "../constants/roles.js";
import {EmployeeCreateModal} from "../components/modals/employee/EmployeeCreateModal.jsx";
import {EmployeeDetailModal} from "../components/modals/employee/EmployeeDetailModal.jsx";
import {EmployeeTerminateModal} from "../components/modals/employee/EmployeeTerminateModal.jsx";

function Employees() {
    const [filterValue, setFilterValue] = React.useState("");
    const [activeFilter, setActiveFilter] = React.useState(new Set(["true"]));
    const [organizationFilter, setOrganizationFilter] = React.useState(new Set());
    const [departmentFilter, setDepartmentFilter] = React.useState(new Set(["all"]));
    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "fullName",
        direction: "ascending",
    });
    const [maxTableHeight, setMaxTableHeight] = React.useState("calc(100dvh - 16rem)");
    const { user } = useAuth();
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
    } = useEmployees();
    const { departments, fetchDepartments } = useDepartments();
    const { organizations, fetchOrganizations } = useOrganizations();
    const [ isCreateModalOpen, setIsCreateModalOpen ] = React.useState(false);
    const [ isDetailModalOpen, setIsDetailModalOpen ] = React.useState(false);
    const [ isTerminateModalOpen, setIsTerminateModalOpen ] = React.useState(false);
    const [ selectedEmployee, setSelectedEmployee ] = React.useState(null);
    const [ isLoadingDetail, setIsLoadingDetail ] = React.useState(false);

    // Detekce mobilního zobrazení
    const isMobile = useIsMobile();

    // Kontrola oprávnění
    const canAlterEmployee = React.useMemo(() => {
        if (!user) return false;
        const allowedRoles = ["SUPERADMIN", "ADMIN", "COORDINATOR"];

        return allowedRoles.includes(user.role);
    }, [user]);

    // Filtrované sloupce pro mobile - jen jméno a akce
    const visibleColumns = React.useMemo(() => {
        if (isMobile) {
            return columns.filter(col => col.key === "fullName" || col.key === "actions");
        }
        return columns;
    }, [isMobile]);

    React.useEffect(() => {
        // Pro superadmina nenačítáme klienty, dokud nevybere organizaci
        if (user?.role !== "SUPERADMIN") {
            fetchEmployees();
        }
        fetchDepartments();
        fetchOrganizations();
    }, [user]);

    React.useEffect(() => {
        if (user?.departmentId && departments.length > 0) {
            const userDepartment = departments.find(dept => dept.id === user.departmentId);
            if (userDepartment) {
                setDepartmentFilter(new Set([userDepartment.name]));
            }
        }
    }, [user, departments]);

    // Když superadmin změní organizaci, znovu načíst klienty s filtrem
    React.useEffect(() => {
        if (user?.role === "SUPERADMIN") {
            if (organizationFilter.size > 0 && organizations.length > 0) {
                const selectedOrgName = Array.from(organizationFilter)[0];
                const selectedOrg = organizations.find(org => org.name === selectedOrgName);
                if (selectedOrg) {
                    fetchEmployees(selectedOrg.id);
                }
            } else {
                // Pokud není vybraná organizace, smaž data
                setEmployees([]);
            }
        }
    }, [organizationFilter, user, organizations]);

    // Dynamická výška tabulky podle velikosti obrazovky
    React.useEffect(() => {
        setMaxTableHeight(isMobile ? "calc(100dvh - 13rem)" : "calc(100dvh - 16rem)");
    }, [isMobile]);

    const hasSearchFilter = Boolean(filterValue);

    // Options pro filtry z API endpointů (již seřazené v hooks)
    const organizationOptions = React.useMemo(() => {
        return organizations.map(org => ({
            name: org.name,
            key: org.name
        }));
    }, [organizations]);

    // Filtrované departments podle vybrané organizace (pro superadminy)
    const filteredDepartments = React.useMemo(() => {
        if (user?.role !== "SUPERADMIN" || organizationFilter.size === 0) {
            return departments;
        }

        // Pro superadmina s vybranou organizací - filtruj departments podle organizace
        const selectedOrgName = Array.from(organizationFilter)[0];
        const selectedOrg = organizations.find(org => org.name === selectedOrgName);

        if (!selectedOrg) {
            return [];
        }

        return departments.filter(dept => dept.organization?.id === selectedOrg.id);
    }, [departments, organizations, organizationFilter, user]);

    const departmentOptions = React.useMemo(() => {
        return filteredDepartments.map(dept => ({
            name: dept.name,
            key: dept.name
        }));
    }, [filteredDepartments]);

    const filteredItems = React.useMemo(() => {
        let filteredEmployees = [...employees];

        // Filtr podle jména (s podporou diakritiky)
        if (hasSearchFilter) {
            const normalizedSearchValue = removeDiacritics(filterValue);
            filteredEmployees = filteredEmployees.filter((employee) =>
                removeDiacritics(employee.name).includes(normalizedSearchValue),
            );
        }

        // Filtr podle aktivity (filtruj jen když nejsou vybrané obě možnosti)
        if (activeFilter.size < 2) {
            filteredEmployees = filteredEmployees.filter((employee) =>
                activeFilter.has(employee?.active?.toString()),
            );
        }

        // Filtr podle oddělení
        if (!departmentFilter.has("all")) {
            filteredEmployees = filteredEmployees.filter((employee) =>
                departmentFilter.has(employee.department?.name),
            );
        }

        return filteredEmployees;
    }, [employees, filterValue, hasSearchFilter, activeFilter, departmentFilter]);

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

    // Handler pro změnu organization filtru (single select)
    const handleOrganizationFilterChange = React.useCallback((keys) => {
        setOrganizationFilter(new Set(keys));
    }, []);

    // Handler pro změnu department filtru
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
            // Zavři modal JEN pokud bylo vytvoření úspěšné
            handleCloseCreateModal();
        } catch (error) {
            // Pokud je error, modal zůstane otevřený
            console.error("Failed to create employee: ", error);
            // Znovu vyhoď chybu aby modal věděl, že došlo k chybě
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
                        {user?.role === "SUPERADMIN" && (
                            <Dropdown>
                                <DropdownTrigger className="hidden sm:flex">
                                    <Button endContent={<ChevronDown className="size-4" />} variant="flat" className="text-foreground">
                                        Organizace
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="Organization Filter"
                                    closeOnSelect={true}
                                    selectedKeys={organizationFilter}
                                    selectionMode="single"
                                    onSelectionChange={handleOrganizationFilterChange}
                                    className="max-h-60 overflow-y-auto"
                                >
                                    {organizationOptions.map((org) => (
                                        <DropdownItem key={org.key}>
                                            {org.name}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        )}

                        {canAlterEmployee && (
                            <Dropdown>
                                <DropdownTrigger className="hidden sm:flex">
                                    <Button endContent={<ChevronDown className="size-4" />} variant="flat" className="text-foreground">
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
                                        isDisabled={user?.role === "SUPERADMIN" && organizationFilter.size === 0}
                                    >
                                        Oddělení
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
                    <span className="text-small">Celkem {filteredItems.length} zaměstnanců</span>
                </div>
            </div>
        );
    }, [
        filterValue,
        activeFilter,
        organizationFilter,
        departmentFilter,
        filteredItems.length,
        employees.length,
        onSearchChange,
        onClear,
        activeOptions,
        organizationOptions,
        departmentOptions,
        handleOrganizationFilterChange,
        handleDepartmentFilterChange,
        canAlterEmployee,
        user,
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
                        <p className="text-small">{cellValue?.name || "-"}</p>
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
                                        {employee.active ? (
                                            <DropdownItem key="terminate"
                                                          startContent={<UserRoundX />}
                                                          variant="light"
                                                          color="danger"
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100dvh-20rem)]">
                <Spinner size="lg" variant="gradient" label="Načítání zaměstnanců..." />
            </div>
        );
    }

    return (
        <>
            <Table
                isVirtualized
                aria-label="Employees table"
                classNames={{
                    th: "bg-content1",
                }}
                maxTableHeight={maxTableHeight}
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
                    emptyContent={
                        (user?.role === "SUPERADMIN" && organizationFilter.size === 0)
                            ? "Vyberte prosím organizaci" : "Žádní zaměstnanci nenalezeni"
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
                departments={departments}
            />

            <EmployeeDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                onSubmit={handleUpdateEmployee}
                canEdit={canAlterEmployee}
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
        </>
    );
}

export default Employees;

