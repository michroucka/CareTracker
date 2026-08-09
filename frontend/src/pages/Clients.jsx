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
import {
    ChevronDown,
    FileText,
    Funnel,
    MoreVertical,
    Plus,
    Search,
    UserRound,
    UserRoundCheck, UserRoundPlus,
    UserRoundX
} from "lucide-react";
import {useClients} from "../hooks/useClients.jsx";
import {useDepartments} from "../hooks/useDepartments.jsx";
import {useEmployees} from "../hooks/useEmployees.jsx";
import {useTasks} from "../hooks/useTasks.jsx";
import {useIsMobile} from "../hooks/useMediaQuery.js";
import {columns, genderOptions, genderTranslations} from "../constants/clientConstants.js";
import {activeOptions} from "../constants/globalConstants.js";
import {useAuth} from "../contexts/AuthContext.tsx";
import {removeDiacritics} from "../utils/formatters.js";
import {sortByKey} from "../utils/sorting.js";
import {ClientTerminateModal} from "../components/modals/client/ClientTerminateModal.jsx";
import {FiltersModal} from "../components/modals/FiltersModal.jsx";
import {ClientCreateAccountModal} from "../components/modals/client/ClientCreateAccountModal.jsx";
import {ClientDeactivateAccountModal} from "../components/modals/client/ClientDeactivateAccountModal.jsx";

function Clients() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

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
    const getInitialCaregiverFilter = () => {
        const caregivers = searchParams.get("caregivers");
        if (!caregivers) return new Set(["all"]);
        return caregivers === "all" ? new Set(["all"]) : new Set(caregivers.split(","));
    };

    const [filterValue, setFilterValue] = React.useState(getInitialFilterValue);
    const [activeFilter, setActiveFilter] = React.useState(getInitialActiveFilter);
    const [departmentFilter, setDepartmentFilter] = React.useState(getInitialDepartmentFilter);
    const [caregiverFilter, setCaregiverFilter] = React.useState(getInitialCaregiverFilter);
    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "fullName",
        direction: "ascending",
    });
    const { user, superadminOrg } = useAuth();
    const {
        clients,
        setClients,
        loading,
        fetchClients,
        fetchClient,
        terminateClient,
        activateClient,
        createClientAccount,
        deactivateClientAccount,
        activateClientAccount
    } = useClients();
    const { departments, fetchDepartments } = useDepartments();
    const { employees, fetchEmployees } = useEmployees();
    const hasLoadedMetadata = React.useRef(false);
    const [ isTerminateModalOpen, setIsTerminateModalOpen ] = React.useState(false);
    const [ selectedClient, setSelectedClient ] = React.useState(null);
    const [ isFiltersModalOpen, setIsFiltersModalOpen ] = React.useState(false);
    const [ isCreateAccountModalOpen, setIsCreateAccountModalOpen ] = React.useState(false);
    const [ isDeactivateAccountModalOpen, setIsDeactivateAccountModalOpen ] = React.useState(false);

    const isMobile = useIsMobile();

    const canAlterClient = React.useMemo(() => {
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
            city: dept.city,
            key: dept.city
        }));
    }, [departments]);

    const filteredEmployees = React.useMemo(() => {
        let filtered = [...employees];

        // Filtruj podle departmentu
        if (!departmentFilter.has("all")) {
            filtered = filtered.filter(employee =>
                departmentFilter.has(employee.department?.city)
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

    React.useEffect(() => {
        if (!user || hasLoadedMetadata.current) return;
        if (user.role === "SUPERADMIN") return;

        hasLoadedMetadata.current = true;
        fetchDepartments({ status: "true" });
        fetchEmployees({ status: "true" });
    }, [user]);

    React.useEffect(() => {
        if (user?.role !== "SUPERADMIN") return;
        if (!superadminOrg) {
            setClients([]);
            return;
        }
        fetchDepartments({ organizationId: superadminOrg.id, status: "true" });
        fetchEmployees({ organizationId: superadminOrg.id, status: "true" });
    }, [user, superadminOrg]);


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
        const allowedToFilterDepartment = !['CAREGIVER', 'COORDINATOR'].includes(user.role);

        if (filterValue) {
            params.set("search", filterValue);
        }

        if (activeFilter.size === 2) {
            params.set("status", "all");
        } else if (activeFilter.has("true")) {
            params.set("status", "true");
        } else if (activeFilter.has("false")) {
            params.set("status", "false");
        }

        const shouldSaveFilters = user.role !== "SUPERADMIN" || !!superadminOrg;

        if (allowedToFilterDepartment && shouldSaveFilters) {
            if (!departmentFilter.has("all")) {
                params.set("departments", Array.from(departmentFilter).join(","));
            } else {
                params.set("departments", "all");
            }
        }

        if (shouldSaveFilters) {
            if (!caregiverFilter.has("all")) {
                params.set("caregivers", Array.from(caregiverFilter).join(","));
            } else {
                params.set("caregivers", "all");
            }
        }

        setSearchParams(params, { replace: true });
    }, [filterValue, activeFilter, departmentFilter, caregiverFilter, user, superadminOrg]);

    const prevSuperadminOrgId = React.useRef(superadminOrg?.id);
    React.useEffect(() => {
        if (user?.role !== "SUPERADMIN") return;

        if (prevSuperadminOrgId.current !== superadminOrg?.id) {
            setDepartmentFilter(new Set(["all"]));
            setCaregiverFilter(new Set(["all"]));
        }

        prevSuperadminOrgId.current = superadminOrg?.id;
    }, [user, superadminOrg]);

    React.useEffect(() => {
        if (user?.role === "SUPERADMIN") {
            if (!superadminOrg) return;
            if (departments.length === 0 || employees.length === 0) return;
        } else {
            if (departments.length === 0 || employees.length === 0) return;
        }

        let currentFilteredEmployees = [...employees];
        if (!departmentFilter.has("all")) {
            currentFilteredEmployees = currentFilteredEmployees.filter(emp => departmentFilter.has(emp.department?.city));
        }

        const filters = {
            organizationId: superadminOrg?.id,
            status: getStatusFromFilter(activeFilter),
            departmentIds: getDepartmentIdsFromFilter(departmentFilter, departments),
            caregiverIds: getCaregiverIdsFromFilter(caregiverFilter, currentFilteredEmployees),
        };

        fetchClients(filters);
    }, [superadminOrg, activeFilter, departmentFilter, caregiverFilter, user, departments, employees]);

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

    function getCaregiverIdsFromFilter(caregiverFilter, employees) {
        if (caregiverFilter.has("all")) {
            return undefined;
        }
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

    const handleOpenCreateAccountModal = async (clientId) => {
        setIsCreateAccountModalOpen(true);

        try {
            await handleSelectClient(clientId);
        } catch {
            setIsCreateAccountModalOpen(false);
        }
    }

    const handleCloseCreateAccountModal = () => {
        setSelectedClient(null);
        setIsCreateAccountModalOpen(false);
    }

    const handleCreateClientAccount = async (email) => {
        await createClientAccount(selectedClient.id, email);
    }

    const handleOpenDeactivateAccountModal = async (clientId) => {
        setIsDeactivateAccountModalOpen(true);

        try {
            await handleSelectClient(clientId);
        } catch {
            setIsDeactivateAccountModalOpen(false);
        }
    }

    const handleCloseDeactivateAccountModal = () => {
        setSelectedClient(null);
        setIsDeactivateAccountModalOpen(false);
    }

    const handleDeactivateClientAccount = async (clientId) => {
        await deactivateClientAccount(clientId);
    }

    const handleActivateClientAccount = async (clientId) => {
        await activateClientAccount(clientId);
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
        setCaregiverFilter(filters.caregiverFilter);
    }, []);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full lg:max-w-[44%]"
                        placeholder="Hledat podle jména..."
                        startContent={<Search className="size-5" />}
                        value={filterValue}
                        onClear={() => onClear()}
                        onValueChange={onSearchChange}
                        isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                    />
                    <div className="flex gap-3">
                        <Button
                            isIconOnly
                            variant="flat"
                            className="lg:hidden"
                            onPress={handleOpenFiltersModal}
                        >
                            <Funnel className="size-4" />
                        </Button>
                        {user?.role !== "CLIENT" && (
                            <Dropdown>
                                <DropdownTrigger className="hidden lg:flex">
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
                                <DropdownTrigger className="hidden lg:flex">
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
                                            {dept.city}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        )}

                        <Dropdown>
                            <DropdownTrigger className="hidden lg:flex">
                                <Button
                                    endContent={<ChevronDown className="size-4" />}
                                    variant="flat"
                                    className="text-foreground"
                                    isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
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
                                    onPress={() => navigate("/clients/new")}
                                    isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                            >
                                Přidat
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex flex-row justify-start items-center">
                    <span className="text-small">Celkem {filteredItems.length} {filteredItems.length === 1 ? "klient" : filteredItems.length >= 2 && filteredItems.length <= 4 ? "klienti" : "klientů"}</span>
                </div>
            </div>
        );
    }, [
        filterValue,
        activeFilter,
        departmentFilter,
        caregiverFilter,
        filteredItems.length,
        clients.length,
        onSearchChange,
        onClear,
        genderOptions,
        activeOptions,
        departmentOptions,
        caregiverOptions,
        handleDepartmentFilterChange,
        handleCaregiverFilterChange,
        handleOpenFiltersModal,
        canAlterClient,
        user,
        superadminOrg,
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
                        <p className="text-small">{cellValue?.city || "-"}</p>
                    </div>
                );
            case "caregiver":
                return (
                    <div className="flex flex-col">
                        <p className="text-small">
                            {cellValue ? `${cellValue.fullName}` : "-"}
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
                                                  onPress={() => navigate(`/clients/${client.id}`)}
                                    >
                                        Detail
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
                                        {client.userAccountActive === null ? (
                                            <DropdownItem key="create-account"
                                                          startContent={<UserRoundPlus />}
                                                          variant="light"
                                                          onPress={() => handleOpenCreateAccountModal(client.id)}
                                            >
                                                Vytvořit účet
                                            </DropdownItem>
                                        ) : client.userAccountActive === true ? (
                                            <DropdownItem key="deactivate-account"
                                                          startContent={<UserRoundX />}
                                                          variant="light"
                                                          color="danger"
                                                          onPress={() => handleOpenDeactivateAccountModal(client.id)}
                                            >
                                                Deaktivovat účet
                                            </DropdownItem>
                                        ) : (
                                            <DropdownItem key="activate-account"
                                                          startContent={<UserRoundCheck />}
                                                          variant="light"
                                                          color="success"
                                                          onPress={() => handleActivateClientAccount(client.id)}
                                            >
                                                Aktivovat účet
                                            </DropdownItem>
                                        )}
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

    const hasLoadedData = React.useRef(false);

    React.useEffect(() => {
        if (!loading && departments.length > 0 && employees.length > 0) {
            hasLoadedData.current = true;
        }
    }, [loading, departments.length, employees.length]);

    const isSuperadminWithoutOrg = user?.role === "SUPERADMIN" && !superadminOrg;
    const isLoadingMetadata = departments.length === 0 || employees.length === 0;
    const isLoading = !isSuperadminWithoutOrg && (loading || isLoadingMetadata || !hasLoadedData.current);

    return (
        <>
            <Table
                isHeaderSticky
                removeWrapper
                aria-label="Clients table"
                sortDescriptor={sortDescriptor}
                topContent={topContent}
                topContentPlacement="outside"
                onSortChange={setSortDescriptor}
                classNames={{ table: "clickable-rows" }}
                onRowAction={(key) => navigate(`/clients/${key}`)}
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
                    loadingContent={<Spinner className="mt-72" label="Načítání klientů..." />}
                    emptyContent={
                        isSuperadminWithoutOrg
                            ? "Vyberte prosím organizaci v navigační liště" : "Žádní klienti nenalezeni"
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

            <ClientTerminateModal
                isOpen={isTerminateModalOpen}
                onClose={handleCloseTerminateModal}
                onSubmit={handleTerminateClient}
                clientId={selectedClient?.id}
                clientName={selectedClient?.fullName}
            />

            <ClientCreateAccountModal
                isOpen={isCreateAccountModalOpen}
                onClose={handleCloseCreateAccountModal}
                onSubmit={handleCreateClientAccount}
                clientName={selectedClient?.fullName}
                clientEmail={selectedClient?.email}
            />

            <ClientDeactivateAccountModal
                isOpen={isDeactivateAccountModalOpen}
                onClose={handleCloseDeactivateAccountModal}
                onSubmit={handleDeactivateClientAccount}
                clientId={selectedClient?.id}
                clientName={selectedClient?.fullName}
            />

            <FiltersModal
                isOpen={isFiltersModalOpen}
                onClose={handleCloseFiltersModal}
                onSubmit={handleFiltersChange}
                user={user}
                superadminOrgSelected={!!superadminOrg}
                showStatusFilter={canAlterClient}
                initialActiveFilter={activeFilter}
                initialDepartmentFilter={departmentFilter}
                initialCaregiverFilter={caregiverFilter}
                activeOptions={activeOptions}
                departmentOptions={departmentOptions}
                caregiverOptions={caregiverOptions}
            />
        </>
    );
}

export default Clients;

