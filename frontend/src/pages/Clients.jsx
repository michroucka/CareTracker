import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownSection,
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
import {ChevronDown, FileText, Funnel, MoreVertical, Plus, Search, UserRound, UserRoundCheck, UserRoundX} from "lucide-react";
import {useClients} from "../hooks/useClients.jsx";
import {useDepartments} from "../hooks/useDepartments.jsx";
import {useEmployees} from "../hooks/useEmployees.jsx";
import {useTasks} from "../hooks/useTasks.jsx";
import {useOrganizations} from "../hooks/useOrganizations.jsx";
import {useIsMobile} from "../hooks/useMediaQuery.js";
import {activeOptions, columns, genderOptions, genderTranslations} from "../constants/clientConstants.js";
import {useAuth} from "../contexts/AuthContext.tsx";
import {ClientCreateModal} from "../components/modals/client/ClientCreateModal.jsx";
import {removeDiacritics} from "../utils/formatters.js";
import {sortByKey} from "../utils/sorting.js";
import {ClientDetailModal} from "../components/modals/client/ClientDetailModal.jsx";
import {ClientTerminateModal} from "../components/modals/client/ClientTerminateModal.jsx";
import {FiltersModal} from "../components/modals/FiltersModal.jsx";

function Clients() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

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
    const getInitialCaregiverFilter = () => {
        const caregivers = searchParams.get("caregivers");
        if (!caregivers) return new Set(["all"]);
        return caregivers === "all" ? new Set(["all"]) : new Set(caregivers.split(","));
    };

    const [filterValue, setFilterValue] = React.useState(getInitialFilterValue);
    const [activeFilter, setActiveFilter] = React.useState(getInitialActiveFilter);
    const [organizationFilter, setOrganizationFilter] = React.useState(getInitialOrganizationFilter);
    const [departmentFilter, setDepartmentFilter] = React.useState(getInitialDepartmentFilter);
    const [caregiverFilter, setCaregiverFilter] = React.useState(getInitialCaregiverFilter);
    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "fullName",
        direction: "ascending",
    });
    const [maxTableHeight, setMaxTableHeight] = React.useState("calc(100dvh - 16rem)");
    const { user } = useAuth();
    const {
        clients,
        setClients,
        loading,
        fetchClients,
        fetchClient,
        createClient,
        updateClient,
        terminateClient,
        activateClient
    } = useClients();
    const { departments, fetchDepartments } = useDepartments();
    const { organizations, fetchOrganizations } = useOrganizations();
    const { employees, fetchEmployees } = useEmployees();
    const { tasks, fetchTasks } = useTasks();
    const hasLoadedMetadata = React.useRef(false);
    const [ isCreateModalOpen, setIsCreateModalOpen ] = React.useState(false);
    const [ isDetailModalOpen, setIsDetailModalOpen ] = React.useState(false);
    const [ isTerminateModalOpen, setIsTerminateModalOpen ] = React.useState(false);
    const [ selectedClient, setSelectedClient ] = React.useState(null);
    const [ isLoadingDetail, setIsLoadingDetail ] = React.useState(false);
    const [ isFiltersModalOpen, setIsFiltersModalOpen ] = React.useState(false);

    // Detekce mobilního zobrazení
    const isMobile = useIsMobile();

    // Kontrola oprávnění
    const canAlterClient = React.useMemo(() => {
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

    // Filtrované employees podle departmentu
    // Pro SUPERADMIN: employees už jsou načtené s filtrem organizationId z API, takže filtrujeme jen podle departmentu
    const filteredEmployees = React.useMemo(() => {
        let filtered = [...employees];

        // Filtruj podle departmentu
        if (!departmentFilter.has("all")) {
            filtered = filtered.filter(employee =>
                departmentFilter.has(employee.department?.name)
            );
        }

        return filtered;
    }, [employees, departmentFilter]);

    const caregiverOptions = React.useMemo(() => {
        return filteredEmployees.map(emp => ({
            name: emp.fullName,
            key: emp.fullName
        }));
    }, [filteredEmployees]);

    const filteredItems = React.useMemo(() => {
        let filteredClients = [...clients];

        // Filtr podle jména (s podporou diakritiky)
        if (hasSearchFilter) {
            const normalizedSearchValue = removeDiacritics(filterValue);
            filteredClients = filteredClients.filter((client) =>
                removeDiacritics(client.fullName).includes(normalizedSearchValue),
            );
        }

        return filteredClients;
    }, [clients, filterValue, hasSearchFilter]);

    const sortedItems = React.useMemo(() => {
        return sortByKey(sortByKey(filteredItems, "firstName", sortDescriptor.direction), "lastName", sortDescriptor.direction);
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

    // Handler pro změnu caregiver filtru
    const handleCaregiverFilterChange = React.useCallback((keys) => {
        const newKeys = new Set(keys);

        if (newKeys.has("all") && !caregiverFilter.has("all")) {
            setCaregiverFilter(new Set(["all"]));
        }
        else if (newKeys.size > 1 && newKeys.has("all")) {
            newKeys.delete("all");
            setCaregiverFilter(newKeys);
        }
        else if (newKeys.size === 0) {
            setCaregiverFilter(new Set(["all"]));
        }
        else {
            setCaregiverFilter(newKeys);
        }
    }, [caregiverFilter]);

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

        // Pro SUPERADMIN načíst jen organizace, ostatní metadata až po výběru organizace
        // Pro ostatní role načíst vše
        if (user.role === "SUPERADMIN") {
            fetchOrganizations();
        } else {
            fetchDepartments();
            fetchOrganizations();
            fetchEmployees();
            fetchTasks();
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

        // Pro SUPERADMIN: department a caregiver filtry jen když je vybraná organizace
        const shouldSaveFilters = user.role !== "SUPERADMIN" || organizationFilter.size > 0;

        // Department filter - pouze pro SUPERADMIN a ADMIN (a jen když je vybraná organizace pro SUPERADMIN)
        const allowedToFilterDepartment = !['CAREGIVER', 'COORDINATOR'].includes(user.role);
        if (allowedToFilterDepartment && shouldSaveFilters) {
            if (!departmentFilter.has("all")) {
                params.set("departments", Array.from(departmentFilter).join(","));
            } else {
                params.set("departments", "all");
            }
        }
        // Pro CAREGIVER a COORDINATOR neukladat departments do URL (vždy jen jejich oddělení)

        // Caregiver filter - jen když je vybraná organizace (pro SUPERADMIN)
        if (shouldSaveFilters) {
            if (!caregiverFilter.has("all")) {
                params.set("caregivers", Array.from(caregiverFilter).join(","));
            } else {
                params.set("caregivers", "all");
            }
        }

        // Aktualizovat URL bez vytvoření nového záznamu v historii
        setSearchParams(params, { replace: true });
    }, [filterValue, activeFilter, organizationFilter, departmentFilter, caregiverFilter, user]);

    // Pro SUPERADMIN načíst metadata když vybere organizaci
    React.useEffect(() => {
        if (user?.role !== "SUPERADMIN") return;
        if (organizations.length === 0) return;
        if (organizationFilter.size === 0) {
            // Pokud není vybraná organizace, vyčisti jen clients (ne metadata)
            setClients([]);
            return;
        }

        const selectedOrgName = Array.from(organizationFilter)[0];
        const selectedOrg = organizations.find(org => org.name === selectedOrgName);
        if (!selectedOrg) return;

        // Načíst metadata s filtrem podle vybrané organizace
        fetchDepartments({ organizationId: selectedOrg.id });
        fetchEmployees({ organizationId: selectedOrg.id });
        fetchTasks({ organizationId: selectedOrg.id });
    }, [user, organizations, organizationFilter]);

    // Pro SUPERADMIN resetovat department a caregiver filtry při změně organizace
    const prevOrganizationFilter = React.useRef(organizationFilter);
    React.useEffect(() => {
        if (user?.role !== "SUPERADMIN") return;

        // Zkontroluj jestli se organizace změnila (ne jen při prvním renderu)
        if (prevOrganizationFilter.current.size > 0 || organizationFilter.size > 0) {
            const prevOrg = Array.from(prevOrganizationFilter.current)[0];
            const currentOrg = Array.from(organizationFilter)[0];

            // Pokud se organizace změnila nebo byla odvolána, resetuj filtry
            if (prevOrg !== currentOrg) {
                setDepartmentFilter(new Set(["all"]));
                setCaregiverFilter(new Set(["all"]));
            }
        }

        prevOrganizationFilter.current = organizationFilter;
    }, [user, organizationFilter]);

    // Když se změní filtry, znovu načíst klienty s filtrem
    React.useEffect(() => {
        // Pro SUPERADMIN: počkej na metadata a vybranou organizaci
        if (user?.role === "SUPERADMIN") {
            if (organizations.length === 0 || organizationFilter.size === 0) return;
            if (departments.length === 0 || employees.length === 0) return;
        } else {
            // Pro ostatní role: počkej na metadata
            if (departments.length === 0 || employees.length === 0) return;
        }

        // Departments jsou již filtrovány backendem podle organizationId
        // Employees jsou již filtrovány backendem podle organizationId
        // Filtrujeme pouze employees podle departmentu (pro UI účely)
        let currentFilteredEmployees = [...employees];
        if (!departmentFilter.has("all")) {
            currentFilteredEmployees = currentFilteredEmployees.filter(emp => departmentFilter.has(emp.department?.name));
        }

        if (user?.role === "SUPERADMIN") {
            // Superadmin musi vybrat organization
            if (organizationFilter.size === 0) {
                // Pokud není vybraná organizace, smaž data
                setClients([]);
                return;
            }

            const selectedOrgName = Array.from(organizationFilter)[0];
            const selectedOrg = organizations.find(org => org.name === selectedOrgName);

            if (!selectedOrg) return;

            // Sestavit filtry
            const filters = {
                organizationId: selectedOrg.id,
                status: getStatusFromFilter(activeFilter),
                departmentIds: getDepartmentIdsFromFilter(departmentFilter, departments),
                caregiverIds: getCaregiverIdsFromFilter(caregiverFilter, currentFilteredEmployees),
            };

            fetchClients(filters);
        } else {
            // Ostatní role
            const filters = {
                status: getStatusFromFilter(activeFilter),
                departmentIds: getDepartmentIdsFromFilter(departmentFilter, departments),
                caregiverIds: getCaregiverIdsFromFilter(caregiverFilter, currentFilteredEmployees),
            };

            fetchClients(filters);
        }
    }, [organizationFilter, activeFilter, departmentFilter, caregiverFilter, user, organizations, departments, employees]);

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

    function getCaregiverIdsFromFilter(caregiverFilter, employees) {
        if (caregiverFilter.has("all")) {
            return undefined;
        }
        // Převést jména pečovatelů na ID
        return employees
            .filter(emp => caregiverFilter.has(emp.fullName))
            .map(emp => emp.id);
    }

    async function handleSelectClient(clientId) {
        try {
            const clientData = await fetchClient(clientId);
            setSelectedClient(clientData);
        } catch (error) {
            console.error("Failed to load client:", error);
            throw error;
        }
    }

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    }

    const handleCreateClient = async (clientData) => {
        try {
            await createClient(clientData);
            // Zavři modal JEN pokud bylo vytvoření úspěšné
            handleCloseCreateModal();
        } catch (error) {
            // Pokud je error, modal zůstane otevřený
            // Error toast se zobrazí automaticky v useClients hook
            console.error("Failed to create client: ", error);
            // Znovu vyhoď chybu aby modal věděl, že došlo k chybě
            throw error;
        }
    }

    const handleUpdateClient = async (clientId, clientData) => {
        try {
            return await updateClient(clientId, clientData);
        } catch (error) {
            console.error("Failed to update client:", error);
            throw error;
        }
    }

    const handleOpenDetailModal = async (clientId) => {
        setIsLoadingDetail(true);
        setIsDetailModalOpen(true);

        try {
            await handleSelectClient(clientId);
        } catch {
            setIsDetailModalOpen(false);
        }

        setIsLoadingDetail(false);
    }

    const handleCloseDetailModal = () => {
        setSelectedClient(null);
        setIsDetailModalOpen(false);
    }

    const handleOpenTerminateModal = async (clientId) => {
        setIsTerminateModalOpen(true);

        try {
            await handleSelectClient(clientId);
        } catch {
            setIsTerminateModalOpen(false);
        }
    }

    const handleCloseTerminateModal = () => {
        setSelectedClient(null);
        setIsTerminateModalOpen(false);
    }

    const handleTerminateClient = async (clientId, data) => {
        try {
            await terminateClient(clientId, data);
        } catch (error) {
            console.error("Failed to terminate client:", error);
            throw error;
        }
    }

    const handleActivateClient = async (clientId) => {
        try {
            await activateClient(clientId);
        } catch (error) {
            console.error("Failed to activate client:", error);
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
        setCaregiverFilter(filters.caregiverFilter);
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

                        {canAlterClient && (
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

                        <Dropdown>
                            <DropdownTrigger className="hidden sm:flex">
                                <Button
                                    endContent={<ChevronDown className="size-4" />}
                                    variant="flat"
                                    className="text-foreground"
                                    isDisabled={user?.role === "SUPERADMIN" && organizationFilter.size === 0}
                                >
                                    Pečovatel
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                disallowEmptySelection
                                aria-label="Caregiver Filter"
                                closeOnSelect={false}
                                selectedKeys={caregiverFilter}
                                selectionMode="multiple"
                                onSelectionChange={handleCaregiverFilterChange}
                                className="max-h-60 overflow-y-auto"
                            >
                                <DropdownItem key="all">Všichni</DropdownItem>
                                {caregiverOptions.map((caregiver) => (
                                    <DropdownItem key={caregiver.key}>
                                        {caregiver.name}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>

                        {canAlterClient && (
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
                    <span className="text-small">Celkem {filteredItems.length} klientů</span>
                </div>
            </div>
        );
    }, [
        filterValue,
        activeFilter,
        organizationFilter,
        departmentFilter,
        caregiverFilter,
        filteredItems.length,
        clients.length,
        onSearchChange,
        onClear,
        genderOptions,
        activeOptions,
        organizationOptions,
        departmentOptions,
        caregiverOptions,
        handleOrganizationFilterChange,
        handleDepartmentFilterChange,
        handleCaregiverFilterChange,
        handleOpenFiltersModal,
        canAlterClient,
        user,
    ]);

    const renderCell = React.useCallback((client, columnKey) => {
        const cellValue = client[columnKey];

        switch (columnKey) {
            case "fullName":
                return (
                    <div className="flex flex-col">
                        <p className="font-bold text-small">{cellValue}</p>
                    </div>
                );
            case "gender":
                return (
                    <div className="flex flex-col">
                        <p className="text-small">{genderTranslations[cellValue] || "-"}</p>
                    </div>
                );
            case "address":
                return (
                    <div className="flex flex-col">
                        <p className="text-small">{cellValue || "-"}</p>
                    </div>
                );
            case "department":
                return (
                    <div className="flex flex-col">
                        <p className="text-small">{cellValue?.name || "-"}</p>
                    </div>
                );
            case "caregiver":
                return (
                    <div className="flex flex-col">
                        <p className="text-small">
                            {cellValue ? `${cellValue.firstName} ${cellValue.lastName}` : "-"}
                        </p>
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
                                <DropdownSection showDivider={canAlterClient}>
                                    <DropdownItem key="view"
                                                  startContent={<UserRound />}
                                                  variant="light"
                                                  isLoading={isLoadingDetail}
                                                  onPress={() => handleOpenDetailModal(client.id)}
                                    >
                                        {isLoadingDetail ? "Načítání..." : "Detail"}
                                    </DropdownItem>
                                    <DropdownItem key="view-ip"
                                                  startContent={<FileText />}
                                                  variant="light"
                                                  onPress={() => navigate(`/clients/${client.id}/individual-plan`)}
                                    >
                                        Individuální plán
                                    </DropdownItem>
                                </DropdownSection>

                                {canAlterClient ? (
                                    <DropdownSection>
                                        {client.active ? (
                                            <DropdownItem key="terminate"
                                                          startContent={<UserRoundX />}
                                                          variant="light"
                                                          color="danger"
                                                          onPress={() => handleOpenTerminateModal(client.id)}
                                            >
                                                Deaktivovat
                                            </DropdownItem>
                                        ) : (
                                            <DropdownItem key="activate"
                                                          startContent={<UserRoundCheck />}
                                                          variant="light"
                                                          color="success"
                                                          onPress={() => handleActivateClient(client.id)}
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
    }, [canAlterClient]);

    // Kontrola jestli se načítají metadata nebo data
    // hasLoadedData sleduje, jestli už proběhlo první načtení
    const hasLoadedData = React.useRef(false);

    React.useEffect(() => {
        // Označit jako načteno, jakmile se dokončí první načtení
        if (!loading && departments.length > 0 && employees.length > 0) {
            hasLoadedData.current = true;
        }
    }, [loading, departments.length, employees.length]);

    // Pro SUPERADMIN bez vybrané organizace není loading (zobrazí se "Vyberte prosím organizaci")
    const isSuperadminWithoutOrg = user?.role === "SUPERADMIN" && organizationFilter.size === 0;
    const isLoadingMetadata = departments.length === 0 || employees.length === 0;
    const isLoading = !isSuperadminWithoutOrg && (loading || isLoadingMetadata || !hasLoadedData.current);

    return (
        <>
            <Table
                isVirtualized
                isHeaderSticky
                aria-label="Clients table"
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
                    isLoading={isLoading}
                    loadingContent={<Spinner label="Načítání klientů..." />}
                    emptyContent={
                        (user?.role === "SUPERADMIN" && organizationFilter.size === 0)
                            ? "Vyberte prosím organizaci" : "Žádní klienti nenalezeni"
                    }
                    items={sortedItems}
                >
                    {(item) => (
                        <TableRow key={item.id} className={!item.active ? "opacity-50" : ""}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <ClientCreateModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onSubmit={handleCreateClient}
                userDept={user?.departmentId}
                departments={departments}
                caregivers={employees}
                tasks={tasks}
            />

            <ClientDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                onSubmit={handleUpdateClient}
                canEdit={canAlterClient}
                client={selectedClient}
                isLoading={isLoadingDetail}
                departments={departments}
                caregivers={employees}
                tasks={tasks}
            />

            <ClientTerminateModal
                isOpen={isTerminateModalOpen}
                onClose={handleCloseTerminateModal}
                onSubmit={handleTerminateClient}
                clientId={selectedClient?.id}
                clientName={selectedClient?.fullName}
            />

            <FiltersModal
                isOpen={isFiltersModalOpen}
                onClose={handleCloseFiltersModal}
                onSubmit={handleFiltersChange}
                user={user}
                showStatusFilter={canAlterClient}
                initialActiveFilter={activeFilter}
                initialOrganizationFilter={organizationFilter}
                initialDepartmentFilter={departmentFilter}
                initialCaregiverFilter={caregiverFilter}
                activeOptions={activeOptions}
                organizationOptions={organizationOptions}
                departmentOptions={departmentOptions}
                caregiverOptions={caregiverOptions}
            />
        </>
    );
}

export default Clients;

