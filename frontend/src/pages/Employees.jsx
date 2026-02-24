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
import {useOrganizations} from "../hooks/useOrganizations.jsx";
import {useIsMobile} from "../hooks/useMediaQuery.js";
import {columns} from '../constants/employeeConstants.js';
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
    const { user } = useAuth();

    // Helper funkce pro inicializaci filtrů z URL
    const getInitialFilterValue = () => searchParams.get("search") || "";
    const getInitialActiveFilter = () => {
        const status = searchParams.get("status");
        if (status === null) return new Set(["true"]);
        if (status === "all") return new Set(["true", "false"]);
        return new Set([status]);
    };
    const getInitialOrganizationFilter = () => {
        const org = searchParams.get("organization");
        return org ? new Set([org]) : new Set();
    };
    const getInitialDepartmentFilter = () => {
        const depts = searchParams.get("departments");
        if (!depts) return new Set(["all"]);
        return depts === "all" ? new Set(["all"]) : new Set(depts.split(","));
    };

    const [filterValue, setFilterValue] = React.useState(getInitialFilterValue);
    const [activeFilter, setActiveFilter] = React.useState(getInitialActiveFilter);
    const [organizationFilter, setOrganizationFilter] = React.useState(getInitialOrganizationFilter);
    const [departmentFilter, setDepartmentFilter] = React.useState(getInitialDepartmentFilter);
    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "fullName",
        direction: "ascending",
    });
    const [maxTableHeight, setMaxTableHeight] = React.useState("calc(100dvh - 16rem)");
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
    const { organizations, fetchOrganizations } = useOrganizations();
    const hasLoadedMetadata = React.useRef(false);
    const [ isCreateModalOpen, setIsCreateModalOpen ] = React.useState(false);
    const [ isDetailModalOpen, setIsDetailModalOpen ] = React.useState(false);
    const [ isTerminateModalOpen, setIsTerminateModalOpen ] = React.useState(false);
    const [ selectedEmployee, setSelectedEmployee ] = React.useState(null);
    const [ isLoadingDetail, setIsLoadingDetail ] = React.useState(false);
    const [ isFiltersModalOpen, setIsFiltersModalOpen ] = React.useState(false);

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

    const hasSearchFilter = Boolean(filterValue);

    // Options pro filtry z API endpointů (již seřazené v hooks)
    const organizationOptions = React.useMemo(() => {
        return organizations.map(org => ({
            name: org.name,
            key: org.name
        }));
    }, [organizations]);

    // Departments jsou již filtrovány backendem podle role uživatele a organizationId
    // Pro SUPERADMIN: načteno s filtrem organizationId z API
    // Pro ostatní role: automaticky filtrováno backendem podle organizace uživatele
    const departmentOptions = React.useMemo(() => {
        return departments.map(dept => ({
            name: dept.name,
            key: dept.name
        }));
    }, [departments]);

    const filteredItems = React.useMemo(() => {
        let filteredEmployees = [...employees];

        // Filtr podle jména (s podporou diakritiky)
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

    // Dynamická výška tabulky podle velikosti obrazovky
    React.useEffect(() => {
        setMaxTableHeight(isMobile ? "calc(100dvh - 13rem)" : "calc(100dvh - 16rem)");
    }, [isMobile]);

    React.useEffect(() => {
        // Načíst metadata pouze jednou (při prvním render s user)
        if (!user || hasLoadedMetadata.current) {
            return;
        }

        hasLoadedMetadata.current = true;

        // Pro SUPERADMIN načíst jen organizace, departments až po výběru organizace
        // Pro ostatní role načíst vše
        if (user.role === "SUPERADMIN") {
            fetchOrganizations();
        } else {
            fetchDepartments();
            fetchOrganizations();
        }
    }, [user]);

    // Validace filtrů podle role uživatele
    React.useEffect(() => {
        if (!user) return;

        const allowedToSeeInactive = ["SUPERADMIN", "ADMIN", "COORDINATOR"].includes(user.role);
        const allowedToSelectOrg = user.role === "SUPERADMIN";

        // CAREGIVER nemá přístup k active filtru - resetovat na "true" (jen aktivní)
        if (!allowedToSeeInactive && !activeFilter.has("true")) {
            setActiveFilter(new Set(["true"]));
        }
        if (!allowedToSeeInactive && activeFilter.size === 2) {
            setActiveFilter(new Set(["true"]));
        }

        // Pouze SUPERADMIN může vybírat organizaci
        if (!allowedToSelectOrg && organizationFilter.size > 0) {
            setOrganizationFilter(new Set());
        }
    }, [user]);

    React.useEffect(() => {
        // Nastavit defaultní department filter jen pro COORDINATOR/CAREGIVER a jen jednou
        // Ale pouze pokud v URL není žádný specifický department filter (aby se nepřepisoval uložený stav)
        const urlDepartments = searchParams.get("departments");
        if (user?.departmentId && departments.length > 0 && departmentFilter.has("all") && (!urlDepartments || urlDepartments === "all")) {
            const userDepartment = departments.find(dept => dept.id === user.departmentId);
            if (userDepartment) {
                setDepartmentFilter(new Set([userDepartment.name]));
            }
        }
    }, [user, departments]);

    // Aktualizovat URL parametry při změně filtrů (s validací oprávnění)
    React.useEffect(() => {
        if (!user) return; // Počkat na načtení user

        const params = new URLSearchParams();
        const allowedToSeeInactive = ["SUPERADMIN", "ADMIN", "COORDINATOR"].includes(user.role);
        const allowedToSelectOrg = user.role === "SUPERADMIN";
        const allowedToFilterDepartment = !['CAREGIVER', 'COORDINATOR'].includes(user.role);

        // Search filter
        if (filterValue) {
            params.set("search", filterValue);
        }

        // Status filter - pouze pro oprávněné role
        if (allowedToSeeInactive) {
            if (activeFilter.size === 2) {
                params.set("status", "all");
            } else if (activeFilter.has("true")) {
                params.set("status", "true");
            } else if (activeFilter.has("false")) {
                params.set("status", "false");
            }
        }
        // Pro CAREGIVER neukladat status do URL (vždy jen aktivní)

        // Organization filter - pouze pro SUPERADMIN
        if (allowedToSelectOrg && organizationFilter.size > 0) {
            params.set("organization", Array.from(organizationFilter)[0]);
        }

        // Pro SUPERADMIN: department filtr jen když je vybraná organizace
        const shouldSaveFilters = user.role !== "SUPERADMIN" || organizationFilter.size > 0;

        // Department filter - pouze pro SUPERADMIN a ADMIN (a jen když je vybraná organizace pro SUPERADMIN)
        if (allowedToFilterDepartment && shouldSaveFilters) {
            if (!departmentFilter.has("all")) {
                params.set("departments", Array.from(departmentFilter).join(","));
            } else {
                params.set("departments", "all");
            }
        }
        // Pro CAREGIVER a COORDINATOR neukladat departments do URL (vždy jen jejich oddělení)

        // Aktualizovat URL bez vytvoření nového záznamu v historii
        setSearchParams(params, { replace: true });
    }, [filterValue, activeFilter, organizationFilter, departmentFilter, user]);

    // Pro SUPERADMIN načíst departments když vybere organizaci
    React.useEffect(() => {
        if (user?.role !== "SUPERADMIN") return;
        if (organizations.length === 0) return;
        if (organizationFilter.size === 0) {
            // Pokud není vybraná organizace, vyčisti data
            setEmployees([]);
            return;
        }

        const selectedOrgName = Array.from(organizationFilter)[0];
        const selectedOrg = organizations.find(org => org.name === selectedOrgName);
        if (!selectedOrg) return;

        // Načíst departments s filtrem podle vybrané organizace
        fetchDepartments({ organizationId: selectedOrg.id });
    }, [user, organizations, organizationFilter]);

    // Pro SUPERADMIN resetovat department filtr při změně organizace
    const prevOrganizationFilter = React.useRef(organizationFilter);
    React.useEffect(() => {
        if (user?.role !== "SUPERADMIN") return;

        // Zkontroluj jestli se organizace změnila
        if (prevOrganizationFilter.current.size > 0 || organizationFilter.size > 0) {
            const prevOrg = Array.from(prevOrganizationFilter.current)[0];
            const currentOrg = Array.from(organizationFilter)[0];

            // Pokud se organizace změnila nebo byla odvolána, resetuj filtr
            if (prevOrg !== currentOrg) {
                setDepartmentFilter(new Set(["all"]));
            }
        }

        prevOrganizationFilter.current = organizationFilter;
    }, [user, organizationFilter]);

    // Když se změní filtry, znovu načíst zaměstnance s filtrem
    React.useEffect(() => {
        // Pro SUPERADMIN: počkej na metadata a vybranou organizaci
        if (user?.role === "SUPERADMIN") {
            if (organizations.length === 0 || organizationFilter.size === 0) return;
            if (departments.length === 0) return;
        } else {
            // Pro ostatní role: počkej na metadata
            if (departments.length === 0) return;
        }

        // Departments jsou již filtrovány backendem podle organizationId

        if (user?.role === "SUPERADMIN") {
            // Superadmin musi vybrat organization
            if (organizationFilter.size === 0) {
                // Pokud není vybraná organizace, smaž data
                setEmployees([]);
                return;
            }

            const selectedOrgName = Array.from(organizationFilter)[0];
            const selectedOrg = organizations.find(org => org.name === selectedOrgName);

            if (!selectedOrg) return;

            // Sestavit filtry
            const filters = {
                organizationId: selectedOrg.id,
                status: getStatusFromFilter(activeFilter),
                departmentIds: getDepartmentIdsFromFilter(departmentFilter, departments)
            };

            fetchEmployees(filters);
        } else {
            // Ostatní role
            const filters = {
                status: getStatusFromFilter(activeFilter),
                departmentIds: getDepartmentIdsFromFilter(departmentFilter, departments)
            };

            fetchEmployees(filters);
        }
    }, [organizationFilter, activeFilter, departmentFilter, user, organizations, departments]);

    // Helper funkce pro převod filtrů z Set na parametry
    function getStatusFromFilter(activeFilter) {
        // Pokud jsou vybrané obě možnosti nebo žádná, nefiltruj
        if (activeFilter.size === 0 || activeFilter.size === 2) {
            return undefined;
        }
        // Jinak vrať true nebo false
        return activeFilter.has("true");
    }

    function getDepartmentIdsFromFilter(departmentFilter, departments) {
        if (departmentFilter.has("all")) {
            return undefined;
        }
        // Převést názvy oddělení na ID
        return departments
            .filter(dept => departmentFilter.has(dept.name))
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

    const handleOpenFiltersModal = () => {
        setIsFiltersModalOpen(true);
    };

    const handleCloseFiltersModal = () => {
        setIsFiltersModalOpen(false);
    }

    const handleFiltersChange = React.useCallback((filters) => {
        setActiveFilter(filters.activeFilter);
        setOrganizationFilter(filters.organizationFilter);
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
                                    <Button
                                        endContent={<ChevronDown
                                            className="size-4" />}
                                        variant="flat"
                                        className="text-foreground"
                                        isDisabled={user?.role === "SUPERADMIN" && organizationFilter.size === 0}
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
        handleOpenFiltersModal,
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

    // Pro SUPERADMIN bez vybrané organizace není loading
    const isSuperadminWithoutOrg = user?.role === "SUPERADMIN" && organizationFilter.size === 0;
    const shouldShowLoading = !isSuperadminWithoutOrg && loading;

    return (
        <>
            <Table
                isVirtualized
                isHeaderSticky
                aria-label="Employees table"
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
                    isLoading={shouldShowLoading}
                    loadingContent={<Spinner label="Načítání zaměstnanců..." />}
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
                showStatusFilter={canAlterEmployee}
                initialActiveFilter={activeFilter}
                initialOrganizationFilter={organizationFilter}
                initialDepartmentFilter={departmentFilter}
                activeOptions={activeOptions}
                organizationOptions={organizationOptions}
                departmentOptions={departmentOptions}
            />
        </>
    );
}

export default Employees;

