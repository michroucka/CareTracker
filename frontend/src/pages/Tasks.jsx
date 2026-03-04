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
import {Check, ChevronDown, Funnel, MoreVertical, Plus, Search, UserRound, UserRoundCheck, UserRoundX, X} from "lucide-react";
import {useOrganizations} from "../hooks/useOrganizations.jsx";
import {useIsMobile} from "../hooks/useMediaQuery.js";
import {activeOptions} from '../constants/globalConstants.js';
import {columns, unitTypeLabels} from '../constants/taskConstants.js';
import {useAuth} from "../contexts/AuthContext.tsx";
import {removeDiacritics} from "../utils/formatters.js";
import {sortByKey} from "../utils/sorting.js";
import {FiltersModal} from "../components/modals/FiltersModal.jsx";
import {useSearchParams} from "react-router-dom";
import {useTasks} from "../hooks/useTasks.jsx";
import {TaskCreateModal} from "../components/modals/task/TaskCreateModal.jsx";
import {TaskDetailModal} from "../components/modals/task/TaskDetailModal.jsx";
import {TaskTerminateModal} from "../components/modals/task/TaskTerminateModal.jsx";

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

    const [filterValue, setFilterValue] = React.useState(getInitialFilterValue);
    const [activeFilter, setActiveFilter] = React.useState(getInitialActiveFilter);
    const [organizationFilter, setOrganizationFilter] = React.useState(getInitialOrganizationFilter);
    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "name",
        direction: "ascending",
    });
    const [maxTableHeight, setMaxTableHeight] = React.useState("calc(100dvh - 16rem)");
    const {
        tasks,
        setTasks,
        loading,
        fetchTasks,
        fetchTask,
        createTask,
        updateTask,
        terminateTask,
        activateTask
    } = useTasks();
    const { organizations, fetchOrganizations } = useOrganizations();
    const hasLoadedMetadata = React.useRef(false);
    const [ isCreateModalOpen, setIsCreateModalOpen ] = React.useState(false);
    const [ isDetailModalOpen, setIsDetailModalOpen ] = React.useState(false);
    const [ isTerminateModalOpen, setIsTerminateModalOpen ] = React.useState(false);
    const [ selectedTask, setSelectedTask ] = React.useState(null);
    const [ isLoadingDetail, setIsLoadingDetail ] = React.useState(false);
    const [ isFiltersModalOpen, setIsFiltersModalOpen ] = React.useState(false);

    // Detekce mobilního zobrazení
    const isMobile = useIsMobile();

    // Kontrola oprávnění
    const canAlterTask = React.useMemo(() => {
        if (!user) return false;
        const allowedRoles = ["SUPERADMIN", "ADMIN"];

        return allowedRoles.includes(user.role);
    }, [user]);

    // Filtrované sloupce pro mobile - jen jméno a akce
    const visibleColumns = React.useMemo(() => {
        if (isMobile) {
            return columns.filter(col => col.key === "name" || col.key === "actions");
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

    const filteredItems = React.useMemo(() => {
        let filteredTasks = [...tasks];

        // Filtr podle jména (s podporou diakritiky)
        if (hasSearchFilter) {
            const normalizedSearchValue = removeDiacritics(filterValue);
            filteredTasks = filteredTasks.filter((employee) =>
                removeDiacritics(employee.fullName).includes(normalizedSearchValue),
            );
        }

        return filteredTasks;
    }, [tasks, filterValue, hasSearchFilter]);

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
        fetchOrganizations({ status: "true" });
    }, [user]);

    // Validace filtrů podle role uživatele
    React.useEffect(() => {
        if (!user) return;

        const allowedToSeeInactive = ["SUPERADMIN", "ADMIN"].includes(user.role);
        const allowedToSelectOrg = user.role === "SUPERADMIN";

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

    // Aktualizovat URL parametry při změně filtrů (s validací oprávnění)
    React.useEffect(() => {
        if (!user) return; // Počkat na načtení user

        const params = new URLSearchParams();
        const allowedToSeeInactive = ["SUPERADMIN", "ADMIN"].includes(user.role);
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

        // Organization filter - pouze pro SUPERADMIN
        if (allowedToSelectOrg && organizationFilter.size > 0) {
            params.set("organization", Array.from(organizationFilter)[0]);
        }

        // Aktualizovat URL bez vytvoření nového záznamu v historii
        setSearchParams(params, { replace: true });
    }, [filterValue, activeFilter, organizationFilter, user]);

    // Když se změní filtry, znovu načíst ukony s filtrem
    React.useEffect(() => {
        // Pro SUPERADMIN: počkej na metadata a vybranou organizaci
        if (user?.role === "SUPERADMIN") {
            if (organizationFilter.size === 0) {
                setTasks([]);
                return;
            }

            if (organizations.length === 0) return;

            const selectedOrgName = Array.from(organizationFilter)[0];
            const selectedOrg = organizations.find(org => org.name === selectedOrgName);

            if (!selectedOrg) return;

            // Sestavit filtry
            const filters = {
                organizationId: selectedOrg.id,
                status: getStatusFromFilter(activeFilter)
            };

            fetchTasks(filters);
        } else {
            // Ostatní role
            const filters = {
                status: getStatusFromFilter(activeFilter),
            };

            fetchTasks(filters);
        }

    }, [organizationFilter, activeFilter, user, organizations]);

    // Helper funkce pro převod filtrů z Set na parametry
    function getStatusFromFilter(activeFilter) {
        // Pokud jsou vybrané obě možnosti nebo žádná, nefiltruj
        if (activeFilter.size === 0 || activeFilter.size === 2) {
            return undefined;
        }
        // Jinak vrať true nebo false
        return activeFilter.has("true");
    }

    async function handleSelectTask(taskId) {
        try {
            const taskData = await fetchTask(taskId);
            setSelectedTask(taskData);
        } catch (error) {
            console.error("Failed to load task:", error);
            throw error;
        }
    }

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    }

    const handleCreateTask = async (taskData) => {
        try {
            await createTask(taskData);
            handleCloseCreateModal();
        } catch (error) {
            console.error("Failed to create task: ", error);
            throw error;
        }
    }

    const handleUpdateTask = async (taskId, taskData) => {
        try {
            return await updateTask(taskId, taskData);
        } catch (error) {
            console.error("Failed to update task:", error);
            throw error;
        }
    }

    const handleOpenDetailModal = async (taskId) => {
        setIsLoadingDetail(true);
        setIsDetailModalOpen(true);

        try {
            await handleSelectTask(taskId);
        } catch {
            setIsDetailModalOpen(false);
        }

        setIsLoadingDetail(false);
    }

    const handleCloseDetailModal = () => {
        setSelectedTask(null);
        setIsDetailModalOpen(false);
    }

    const handleOpenTerminateModal = async (taskId) => {
        setIsTerminateModalOpen(true);

        try {
            await handleSelectTask(taskId);
        } catch {
            setIsTerminateModalOpen(false);
        }
    }

    const handleCloseTerminateModal = () => {
        setSelectedTask(null);
        setIsTerminateModalOpen(false);
    }

    const handleTerminateTask = async (taskId) => {
        try {
            await terminateTask(taskId);
        } catch (error) {
            console.error("Failed to terminate task:", error);
            throw error;
        }
    }

    const handleActivateTask = async (taskId) => {
        try {
            await activateTask(taskId);
        } catch (error) {
            console.error("Failed to activate task:", error);
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
    }, []);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%]"
                        placeholder="Hledat podle názvu..."
                        startContent={<Search className="size-5" />}
                        value={filterValue}
                        onClear={() => onClear()}
                        onValueChange={onSearchChange}
                    />
                    <div className="flex gap-3">
                        {canAlterTask && (
                            <Button
                                isIconOnly
                                variant="flat"
                                className="sm:hidden"
                                onPress={handleOpenFiltersModal}
                            >
                                <Funnel className="size-4" />
                            </Button>
                        )}
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

                        {canAlterTask && (
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

                        {canAlterTask && (
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
                    <span className="text-small">Celkem {filteredItems.length} {filteredItems.length === 1 ? "úkon" : filteredItems.length >= 2 && filteredItems.length <= 4 ? "úkony" : "úkonů"}</span>
                </div>
            </div>
        );
    }, [
        filterValue,
        activeFilter,
        organizationFilter,
        filteredItems.length,
        tasks.length,
        onSearchChange,
        onClear,
        activeOptions,
        organizationOptions,
        handleOrganizationFilterChange,
        handleOpenFiltersModal,
        canAlterTask,
        user,
    ]);

    const renderCell = React.useCallback((task, columnKey) => {
        const cellValue = task[columnKey];

        switch (columnKey) {
            case "name":
                return (
                    <div className="flex flex-col">
                        <p className="font-bold text-small">{cellValue}</p>
                    </div>
                );
            case "unitPrice":
                return (
                    <div className="flex flex-col">
                        <p className="text-small">{cellValue} Kč</p>
                    </div>
                );
            case "unitType":
                return (
                    <div className="flex flex-col">
                        <p className="text-small">{unitTypeLabels[cellValue]}</p>
                    </div>
                )
            case "doubleMeeting":
                return (
                    <div className="flex flex-col items-center">
                        {cellValue === true ? <Check className="size-5" /> : <X className="size-5" />}
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
                                <DropdownSection showDivider={canAlterTask}>
                                    <DropdownItem key="view"
                                                  startContent={<UserRound />}
                                                  variant="light"
                                                  isLoading={isLoadingDetail}
                                                  onPress={() => handleOpenDetailModal(task.id)}
                                    >
                                        {isLoadingDetail ? "Načítání..." : "Detail"}
                                    </DropdownItem>
                                </DropdownSection>

                                {canAlterTask ? (
                                    <DropdownSection>
                                        {task.active ? (
                                            <DropdownItem key="terminate"
                                                          startContent={<UserRoundX />}
                                                          variant="light"
                                                          color="danger"
                                                          onPress={() => handleOpenTerminateModal(task.id)}
                                            >
                                                Deaktivovat
                                            </DropdownItem>
                                        ) : (
                                            <DropdownItem key="activate"
                                                          startContent={<UserRoundCheck />}
                                                          variant="light"
                                                          color="success"
                                                          onPress={() => handleActivateTask(task.id)}
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
    }, [canAlterTask]);

    // Pro SUPERADMIN bez vybrané organizace není loading
    const isSuperadminWithoutOrg = user?.role === "SUPERADMIN" && organizationFilter.size === 0;
    const shouldShowLoading = !isSuperadminWithoutOrg && loading;

    return (
        <>
            <Table
                isVirtualized
                isHeaderSticky
                aria-label="Tasks table"
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
                            align={column.key === "actions" ?
                                "end" : column.key === "doubleMeeting" ?
                                    "center" : "start"
                            }
                            allowsSorting={column.sortable}
                        >
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    isLoading={shouldShowLoading}
                    loadingContent={<Spinner label="Načítání úkonů..." />}
                    emptyContent={
                        (user?.role === "SUPERADMIN" && organizationFilter.size === 0)
                            ? "Vyberte prosím organizaci" : "Žádné úkony nenalezeny"
                    }
                    items={sortedItems}>
                    {(item) => (
                        <TableRow key={item.id} className={!item.active ? "opacity-50" : ""}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <TaskCreateModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onSubmit={handleCreateTask}
            />

            <TaskDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                onSubmit={handleUpdateTask}
                canEdit={canAlterTask}
                task={selectedTask}
                isLoading={isLoadingDetail}
            />

            <TaskTerminateModal
                isOpen={isTerminateModalOpen}
                onClose={handleCloseTerminateModal}
                onSubmit={handleTerminateTask}
                taskId={selectedTask?.id}
                taskName={`${selectedTask?.name}`}
            />

            <FiltersModal
                isOpen={isFiltersModalOpen}
                onClose={handleCloseFiltersModal}
                onSubmit={handleFiltersChange}
                user={user}
                showStatusFilter={canAlterTask}
                initialActiveFilter={activeFilter}
                initialOrganizationFilter={organizationFilter}
                activeOptions={activeOptions}
                organizationOptions={organizationOptions}
            />
        </>
    );
}

export default Employees;

