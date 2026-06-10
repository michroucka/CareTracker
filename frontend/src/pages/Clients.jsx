import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import {ClientCreateModal} from "../components/modals/client/ClientCreateModal.jsx";
import {removeDiacritics} from "../utils/formatters.js";
import {sortByKey} from "../utils/sorting.js";
import {ClientDetailModal} from "../components/modals/client/ClientDetailModal.jsx";
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
        createClient,
        updateClient,
        terminateClient,
        activateClient,
        createClientAccount,
        deactivateClientAccount,
        activateClientAccount
    } = useClients();
    const { departments, fetchDepartments } = useDepartments();
    const { employees, fetchEmployees } = useEmployees();
    const { tasks, fetchTasks } = useTasks();
    const hasLoadedMetadata = React.useRef(false);
    const [ isCreateModalOpen, setIsCreateModalOpen ] = React.useState(false);
    const [ isDetailModalOpen, setIsDetailModalOpen ] = React.useState(false);
    const [ isTerminateModalOpen, setIsTerminateModalOpen ] = React.useState(false);
    const [ selectedClient, setSelectedClient ] = React.useState(null);
    const [ isLoadingDetail, setIsLoadingDetail ] = React.useState(false);
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
        fetchTasks({ status: "true" });
    }, [user]);

    React.useEffect(() => {
        if (user?.role !== "SUPERADMIN") return;
        if (!superadminOrg) {
            setClients([]);
            return;
        }
        fetchDepartments({ organizationId: superadminOrg.id, status: "true" });
        fetchEmployees({ organizationId: superadminOrg.id, status: "true" });
        fetchTasks({ organizationId: superadminOrg.id, status: "true" });
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

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    }

    const handleCreateClient = async (clientData) => {
        try {
            await createClient(clientData);
            handleCloseCreateModal();
        } catch (error) {
            console.error("Failed to create client: ", error);
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
                        {user?.role !== "CLIENT" && (
                            <Dropdown>
                                <Button
                                    variant="tertiary"
                                    className="hidden sm:flex text-foreground"
                                    isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                                >Status <ChevronDown className="size-4" /></Button>
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
                                            <Dropdown.Item key={dept.key} id={dept.key} textValue={dept.city}>
                                                <Dropdown.ItemIndicator />
                                                <Label>{dept.city}</Label>
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}

                        <Dropdown>
                            <Button
                                variant="tertiary"
                                className="hidden sm:flex text-foreground"
                                isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                            >Pečovatel <ChevronDown className="size-4" /></Button>
                            <Dropdown.Popover>
                                <Dropdown.Menu
                                    disallowEmptySelection
                                    aria-label="Caregiver Filter"
                                    closeOnSelect={false}
                                    selectedKeys={caregiverFilter}
                                    selectionMode="multiple"
                                    onSelectionChange={handleCaregiverFilterChange}
                                    className="max-h-60 overflow-y-auto"
                                >
                                    <Dropdown.Item id="all" textValue="Všichni">
                                        <Dropdown.ItemIndicator />
                                        <Label>Všichni</Label>
                                    </Dropdown.Item>
                                    {caregiverOptions.map((caregiver) => (
                                        <Dropdown.Item key={caregiver.key} id={caregiver.key} textValue={caregiver.name}>
                                            <Dropdown.ItemIndicator />
                                            <Label>{caregiver.name}</Label>
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>

                        {canAlterClient && (
                            <Button variant="primary"
                                    onPress={handleOpenCreateModal}
                                    isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                            >Přidat <Plus className="size-4" /></Button>
                        )}
                    </div>
                </div>
                <div className="flex flex-row justify-start items-center">
                    <span className="text-sm">Celkem {filteredItems.length} {filteredItems.length === 1 ? "klient" : filteredItems.length >= 2 && filteredItems.length <= 4 ? "klienti" : "klientů"}</span>
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
                        <p className="font-bold text-sm">{cellValue}</p>
                    </div>
                );
            case "gender":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{genderTranslations[cellValue] || "-"}</p>
                    </div>
                );
            case "address":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{cellValue || "-"}</p>
                    </div>
                );
            case "department":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{cellValue?.city || "-"}</p>
                    </div>
                );
            case "caregiver":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">
                            {cellValue ? `${cellValue.fullName}` : "-"}
                        </p>
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
                                        <Dropdown.Item id="view" textValue="Detail" onAction={() => handleOpenDetailModal(client.id)}>
                                            <UserRound />
                                            <Label>{isLoadingDetail ? "Načítání..." : "Detail"}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id="view-ip" textValue="Individuální plán" onAction={() => navigate(`/clients/${client.id}/individual-plan`)}>
                                            <FileText />
                                            <Label>Individuální plán</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Section>

                                    {canAlterClient ? (
                                        <>
                                            <Separator />
                                            <Dropdown.Section>
                                                {client.userAccountActive === null ? (
                                                    <Dropdown.Item id="create-account" textValue="Vytvořit účet" onAction={() => handleOpenCreateAccountModal(client.id)}>
                                                        <UserRoundPlus />
                                                        <Label>Vytvořit účet</Label>
                                                    </Dropdown.Item>
                                                ) : client.userAccountActive === true ? (
                                                    <Dropdown.Item id="deactivate-account" textValue="Deaktivovat účet" variant="danger" onAction={() => handleOpenDeactivateAccountModal(client.id)}>
                                                        <UserRoundX />
                                                        <Label>Deaktivovat účet</Label>
                                                    </Dropdown.Item>
                                                ) : (
                                                    <Dropdown.Item id="activate-account" textValue="Aktivovat účet" className="text-success" onAction={() => handleActivateClientAccount(client.id)}>
                                                        <UserRoundCheck />
                                                        <Label>Aktivovat účet</Label>
                                                    </Dropdown.Item>
                                                )}
                                                {client.active ? (
                                                    <Dropdown.Item id="terminate" textValue="Deaktivovat" variant="danger" onAction={() => handleOpenTerminateModal(client.id)}>
                                                        <UserRoundX />
                                                        <Label>Deaktivovat</Label>
                                                    </Dropdown.Item>
                                                ) : (
                                                    <Dropdown.Item id="activate" textValue="Aktivovat" className="text-success" onAction={() => handleActivateClient(client.id)}>
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
            {topContent}
            <Table>
                <Table.ScrollContainer>
                    <Table.Content
                        aria-label="Clients table"
                        sortDescriptor={sortDescriptor}
                        onSortChange={setSortDescriptor}
                    >
                        <Table.Header columns={visibleColumns} className="sticky top-0 bg-background z-10">
                            {(column) => (
                                <Table.Column
                                    key={column.key}
                                    align={column.key === "actions" ? "end" : "start"}
                                    allowsSorting={column.sortable}
                                >
                                    {column.name}
                                </Table.Column>
                            )}
                        </Table.Header>
                        <Table.Body
                            items={isLoading ? [] : sortedItems}
                            renderEmptyState={() => (
                                isLoading ? (
                                    <div className="flex flex-col items-center gap-2 mt-72">
                                        <Spinner />
                                        <p className="text-sm text-foreground/60">Načítání klientů...</p>
                                    </div>
                                ) : (
                                    <p>
                                        {isSuperadminWithoutOrg
                                            ? "Vyberte prosím organizaci v navigační liště" : "Žádní klienti nenalezeni"}
                                    </p>
                                )
                            )}
                        >
                            {(item) => (
                                <Table.Row key={item.id} className={!item.active ? "opacity-50" : ""}>
                                    {(columnKey) => <Table.Cell>{renderCell(item, columnKey)}</Table.Cell>}
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>
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

