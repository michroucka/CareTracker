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
import {
    Check,
    ChevronDown, Clipboard, ClipboardCheck, ClipboardList, ClipboardX,
    Eye,
    Funnel,
    MoreVertical,
    Plus,
    Search,
    UserRound,
    UserRoundCheck,
    UserRoundX,
    X
} from "lucide-react";
import {useIsMobile} from "../hooks/useMediaQuery.js";
import {SortableColumnHeader} from "../components/SortableColumnHeader.jsx";
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

function Tasks() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, superadminOrg } = useAuth();

    const getInitialFilterValue = () => searchParams.get("search") || "";
    const getInitialActiveFilter = () => {
        const status = searchParams.get("status");
        if (status === null) return new Set(["true"]);
        if (status === "all") return new Set(["true", "false"]);
        return new Set([status]);
    };
    const [filterValue, setFilterValue] = React.useState(getInitialFilterValue);
    const [activeFilter, setActiveFilter] = React.useState(getInitialActiveFilter);
    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "name",
        direction: "ascending",
    });
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
    const hasLoadedMetadata = React.useRef(false);
    const [ isCreateModalOpen, setIsCreateModalOpen ] = React.useState(false);
    const [ isDetailModalOpen, setIsDetailModalOpen ] = React.useState(false);
    const [ isTerminateModalOpen, setIsTerminateModalOpen ] = React.useState(false);
    const [ selectedTask, setSelectedTask ] = React.useState(null);
    const [ isLoadingDetail, setIsLoadingDetail ] = React.useState(false);
    const [ isFiltersModalOpen, setIsFiltersModalOpen ] = React.useState(false);

    const isMobile = useIsMobile();

    const canAlterTask = React.useMemo(() => {
        if (!user) return false;
        const allowedRoles = ["SUPERADMIN", "ADMIN"];

        return allowedRoles.includes(user.role);
    }, [user]);

    const visibleColumns = React.useMemo(() => {
        if (isMobile) {
            return columns.filter(col => col.key === "name" || col.key === "actions");
        }
        return columns;
    }, [isMobile]);

    const hasSearchFilter = Boolean(filterValue);

    const filteredItems = React.useMemo(() => {
        let filteredTasks = [...tasks];

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


    React.useEffect(() => {
        if (!user) return;

        const allowedToSeeInactive = ["SUPERADMIN", "ADMIN"].includes(user.role);

        if (!allowedToSeeInactive && !activeFilter.has("true")) {
            setActiveFilter(new Set(["true"]));
        }
        if (!allowedToSeeInactive && activeFilter.size === 2) {
            setActiveFilter(new Set(["true"]));
        }
    }, [user]);

    React.useEffect(() => {
        if (!user) return;

        const params = new URLSearchParams();
        const allowedToSeeInactive = ["SUPERADMIN", "ADMIN"].includes(user.role);

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

        setSearchParams(params, { replace: true });
    }, [filterValue, activeFilter, user]);

    React.useEffect(() => {
        if (user?.role === "SUPERADMIN" && !superadminOrg) {
            setTasks([]);
            return;
        }

        const filters = {
            organizationId: superadminOrg?.id,
            status: getStatusFromFilter(activeFilter)
        };

        fetchTasks(filters);
    }, [superadminOrg, activeFilter, user]);

    function getStatusFromFilter(activeFilter) {
        if (activeFilter.size === 0 || activeFilter.size === 2) {
            return undefined;
        }
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
    }, []);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <TextField className="w-full sm:max-w-[44%]">
                        <InputGroup>
                            <InputGroup.Prefix><Search className="size-5 opacity-50" /></InputGroup.Prefix>
                            <InputGroup.Input
                                placeholder="Hledat podle názvu..."
                                value={filterValue}
                                onChange={(e) => onSearchChange(e.target.value)}
                                isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                            />
                        </InputGroup>
                    </TextField>
                    <div className="flex gap-3">
                        {canAlterTask && (
                            <Button
                                isIconOnly
                                variant="tertiary"
                                className="sm:hidden"
                                onPress={handleOpenFiltersModal}
                            >
                                <Funnel className="size-4" />
                            </Button>
                        )}
                        {canAlterTask && (
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

                        {canAlterTask && (
                            <Button variant="primary"
                                    onPress={handleOpenCreateModal}
                                    isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                            >Přidat <Plus className="size-4" /></Button>
                        )}
                    </div>
                </div>
                <div className="flex flex-row justify-start items-center mb-4">
                    <span className="text-sm">Celkem {filteredItems.length} {filteredItems.length === 1 ? "úkon" : filteredItems.length >= 2 && filteredItems.length <= 4 ? "úkony" : "úkonů"}</span>
                </div>
            </div>
        );
    }, [
        filterValue,
        activeFilter,
        filteredItems.length,
        tasks.length,
        onSearchChange,
        onClear,
        activeOptions,
        handleOpenFiltersModal,
        canAlterTask,
        user,
        superadminOrg,
    ]);

    const renderCell = React.useCallback((task, columnKey) => {
        const cellValue = task[columnKey];

        switch (columnKey) {
            case "name":
                return (
                    <div className="flex flex-col">
                        <p className="font-bold text-sm">{cellValue}</p>
                    </div>
                );
            case "unitPrice":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{cellValue} Kč</p>
                    </div>
                );
            case "unitType":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{unitTypeLabels[cellValue]}</p>
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
                            <Button isIconOnly size="sm" variant="ghost">
                                <MoreVertical size={20} />
                            </Button>
                            <Dropdown.Popover>
                                <Dropdown.Menu>
                                    <Dropdown.Section>
                                        <Dropdown.Item id="view"
                                                       textValue={isLoadingDetail ? "Načítání..." : "Detail"}
                                                       onAction={() => handleOpenDetailModal(task.id)}
                                        >
                                            <ClipboardList />
                                            <Label>{isLoadingDetail ? "Načítání..." : "Detail"}</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Section>

                                    {canAlterTask ? (
                                        <>
                                            <Separator />
                                            <Dropdown.Section>
                                                {task.active ? (
                                                    <Dropdown.Item id="terminate"
                                                                   textValue="Deaktivovat"
                                                                   variant="danger"
                                                                   onAction={() => handleOpenTerminateModal(task.id)}
                                                    >
                                                        <ClipboardX />
                                                        <Label>Deaktivovat</Label>
                                                    </Dropdown.Item>
                                                ) : (
                                                    <Dropdown.Item id="activate"
                                                                   textValue="Aktivovat"
                                                                   className="text-success"
                                                                   onAction={() => handleActivateTask(task.id)}
                                                    >
                                                        <ClipboardCheck />
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
    }, [canAlterTask]);

    const isSuperadminWithoutOrg = user?.role === "SUPERADMIN" && !superadminOrg;
    const shouldShowLoading = !isSuperadminWithoutOrg && loading;

    return (
        <>
            {topContent}
            <Table variant="secondary">
                <Table.ScrollContainer>
                    <Table.Content
                        aria-label="Tasks table"
                        sortDescriptor={sortDescriptor}
                        onSortChange={setSortDescriptor}
                    >
                        <Table.Header columns={visibleColumns}>
                            {(column) => (
                                <Table.Column
                                    key={column.key}
                                    id={column.key}
                                    className={column.key === "actions" ?
                                        "text-end" : column.key === "doubleMeeting" ?
                                            "text-center" : ""
                                    }
                                    allowsSorting={column.sortable}
                                    isRowHeader={column.key === "name"}
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
                                        <p className="text-sm text-foreground/60">Načítání úkonů...</p>
                                    </div>
                                ) : (
                                    <p>
                                        {isSuperadminWithoutOrg
                                            ? "Vyberte prosím organizaci v navigační liště" : "Žádné úkony nenalezeny"}
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

            <TaskCreateModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onSubmit={handleCreateTask}
                organizationId={superadminOrg?.id}
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
                superadminOrgSelected={!!superadminOrg}
                showStatusFilter={canAlterTask}
                initialActiveFilter={activeFilter}
                activeOptions={activeOptions}
            />
        </>
    );
}

export default Tasks;

