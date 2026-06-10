import React from "react";
import {useSearchParams} from "react-router-dom";
import {useAuth} from "../contexts/AuthContext.tsx";
import {useClients} from "../hooks/useClients.jsx";
import {useDepartments} from "../hooks/useDepartments.jsx";
import {useEmployees} from "../hooks/useEmployees.jsx";
import {useTasks} from "../hooks/useTasks.jsx";
import {useIsMobile} from "../hooks/useMediaQuery.js";
import {columns, unitTypeTranslations} from "../constants/performedTaskConstants.js"
import {removeDiacritics, formatDateTime, formatNumber} from "../utils/formatters.js";
import {sortByKey} from "../utils/sorting.js";
import {MIN_YEAR} from "../constants/globalConstants.js";
import {
    Button,
    Dropdown,
    Label,
    Separator,
    TextField,
    InputGroup,
    Spinner,
    Table,
    Tooltip
} from "@heroui/react";
import {
    ChevronDown,
    Funnel,
    MoreVertical,
    Plus,
    Search,
    Trash2,
    Eye, Printer, ClipboardList
} from "lucide-react";
import {usePerformedTasks} from "../hooks/usePerformedTasks.jsx";
import {PerformedTaskCreateModal} from "../components/modals/performedTask/PerformedTaskCreateModal.jsx";
import {PerformedTaskDetailModal} from "../components/modals/performedTask/PerformedTaskDetailModal.jsx";
import {FiltersModal} from "../components/modals/FiltersModal.jsx";
import MonthYearPicker from "../components/MonthYearPicker.jsx";
import {GenerateReceiptModal} from "../components/modals/performedTask/GenerateReceiptModal.jsx";
import {DeleteConfirmationModal} from "../components/modals/DeleteConfirmationModal.jsx";

function PerformedTasks() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, superadminOrg } = useAuth();
    const {
        performedTasks,
        setPerformedTasks,
        loading,
        fetchPerformedTasks,
        fetchPerformedTask,
        createPerformedTask,
        updatePerformedTask,
        deletePerformedTask
    } = usePerformedTasks();
    const { clients, fetchClients } = useClients();
    const { departments, fetchDepartments } = useDepartments();
    const { employees, fetchEmployees } = useEmployees();
    const { tasks, fetchTasks } = useTasks();

    const getInitialFilterValue = () => searchParams.get("search") || "";
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
    const getInitialMonthYearFilter = () => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const monthParam = Number(searchParams.get("month"));
        const yearParam = Number(searchParams.get("year"));
        const month = (monthParam >= 1 && monthParam <= 12) ? monthParam - 1 : currentMonth;
        const year = (yearParam >= MIN_YEAR && yearParam <= currentYear) ? yearParam : currentYear;
        return { month, year };
    };

    const [filterValue, setFilterValue] = React.useState(getInitialFilterValue);
    const [departmentFilter, setDepartmentFilter] = React.useState(getInitialDepartmentFilter);
    const [caregiverFilter, setCaregiverFilter] = React.useState(getInitialCaregiverFilter);
    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "date",
        direction: "descending",
    });
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(() => searchParams.get("openCreate") === "true");
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [selectedPerformedTask, setSelectedPerformedTask] = React.useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = React.useState(false);
    const [isFiltersModalOpen, setIsFiltersModalOpen] = React.useState(false);
    const [monthYearFilter, setMonthYearFilter] = React.useState(getInitialMonthYearFilter);

    const hasLoadedMetadata = React.useRef(false);

    const isMobile = useIsMobile();

    const visibleColumns = React.useMemo(() => {
        if (isMobile) {
            return columns.filter(col => ["client", "task", "actions"].includes(col.key));
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

    const filteredEmployees = React.useMemo(() => {
        let filtered = [...employees];

        if (!departmentFilter.has("all")) {
            filtered = filtered.filter(employee =>
                departmentFilter.has(employee.department?.city)
            );
        }

        return filtered;
    }, [employees, departmentFilter]);

    const caregiverOptions = React.useMemo(() => {
        return filteredEmployees.map(emp => {
            const fullName = `${emp.firstName} ${emp.lastName}`;
            return {
                name: fullName,
                key: fullName
            };
        });
    }, [filteredEmployees]);

    const filteredClients = React.useMemo(() => {
        if (departmentFilter.has("all")) {
            return clients;
        }
        return clients.filter(client =>
            departmentFilter.has(client.department?.city)
        );
    }, [clients, departmentFilter]);

    const filteredItems = React.useMemo(() => {
        let filteredPerformedTasks = [...performedTasks];

        if (hasSearchFilter) {
            const normalizedSearchValue = removeDiacritics(filterValue);
            filteredPerformedTasks = filteredPerformedTasks.filter((performedTask) =>
                removeDiacritics(performedTask.clientName).includes(normalizedSearchValue)
            );
        }

        return filteredPerformedTasks;
    }, [performedTasks, filterValue, hasSearchFilter]);

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
        fetchClients({ status: "true" });
        fetchDepartments({ status: "true" });
        fetchEmployees({ status: "true" });
        fetchTasks({ status: "true" });
    }, [user]);

    React.useEffect(() => {
        if (user?.role !== "SUPERADMIN") return;
        if (!superadminOrg) {
            setPerformedTasks([]);
            return;
        }
        fetchClients({ organizationId: superadminOrg.id, status: "true" });
        fetchDepartments({ organizationId: superadminOrg.id, status: "true" });
        fetchEmployees({ organizationId: superadminOrg.id, status: "true" });
        fetchTasks({ organizationId: superadminOrg.id, status: "true" });
    }, [user, superadminOrg]);

    React.useEffect(() => {
        if (!user) return;

        const allowedToFilterDepartment = !['CAREGIVER', 'COORDINATOR'].includes(user.role);

        if (!allowedToFilterDepartment && user.departmentId && departments.length > 0) {
            const userDepartment = departments.find(dept => dept.id === user.departmentId);
            if (userDepartment && !departmentFilter.has(userDepartment.city)) {
                setDepartmentFilter(new Set([userDepartment.city]));
            }
        }
    }, [user, departments]);

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

        params.set("month", monthYearFilter.month + 1);
        params.set("year", monthYearFilter.year);

        setSearchParams(params, { replace: true });
    }, [filterValue, departmentFilter, caregiverFilter, monthYearFilter, user, superadminOrg]);

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
            departmentIds: getDepartmentIdsFromFilter(departmentFilter, departments),
            caregiverIds: getCaregiverIdsFromFilter(caregiverFilter, currentFilteredEmployees),
            month: monthYearFilter.month,
            year: monthYearFilter.year,
        };

        fetchPerformedTasks(filters);
    }, [superadminOrg, departmentFilter, caregiverFilter, monthYearFilter, user, departments, employees]);

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

    async function handleSelectPerformedTask(performedTaskId) {
        try {
            const performedTaskData = await fetchPerformedTask(performedTaskId);
            setSelectedPerformedTask(performedTaskData);
        } catch (error) {
            console.error("Failed to load performed task:", error);
            throw error;
        }
    }

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    }

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    }

    const handleCreatePerformedTask = async (performedTaskData) => {
        try {
            await createPerformedTask(performedTaskData);
            handleCloseCreateModal();
        } catch (error) {
            console.error("Failed to create performed task: ", error);
            throw error;
        }
    }

    const handleUpdatePerformedTask = async (performedTaskId, performedTaskData) => {
        try {
            return await updatePerformedTask(performedTaskId, performedTaskData);
        } catch (error) {
            console.error("Failed to update performed task:", error);
            throw error;
        }
    }

    const handleOpenDetailModal = async (performedTaskId) => {
        setIsLoadingDetail(true);
        setIsDetailModalOpen(true);

        try {
            await handleSelectPerformedTask(performedTaskId);
        } catch {
            setIsDetailModalOpen(false);
        }

        setIsLoadingDetail(false);
    }

    const handleCloseDetailModal = () => {
        setSelectedPerformedTask(null);
        setIsDetailModalOpen(false);
    }

    const handleOpenDeleteModal = async (performedTaskId) => {
        setIsDeleteModalOpen(true);

        try {
            await handleSelectPerformedTask(performedTaskId);
        } catch {
            setIsDeleteModalOpen(false);
        }
    }

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
    }

    const handleDeletePerformedTask = async (performedTaskId) => {
        try {
            return await deletePerformedTask(performedTaskId);
        } catch (error) {
            console.error("Failed to delete performed task:", error);
            throw error;
        }
    }

    const handleOpenReceiptModal = () => {
        setIsReceiptModalOpen(true);
    }

    const handleCloseReceiptModal = () => {
        setIsReceiptModalOpen(false);
    }

    const handleOpenFiltersModal = () => {
        setIsFiltersModalOpen(true);
    };

    const handleCloseFiltersModal = () => {
        setIsFiltersModalOpen(false);
    }

    const handleFiltersChange = React.useCallback((filters) => {
        setDepartmentFilter(filters.departmentFilter);
        setCaregiverFilter(filters.caregiverFilter);
        setMonthYearFilter(filters.monthYearFilter);
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
                                placeholder="Hledat podle klienta..."
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

                        <MonthYearPicker
                            onChange={setMonthYearFilter}
                            className="hidden sm:flex"
                            isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                        />

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

                        <Button variant="primary"
                                onPress={handleOpenCreateModal}
                                isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                        >Přidat <Plus className="size-4" /></Button>
                    </div>
                </div>
                <div className="flex flex-row justify-between items-center">
                    <span className="text-sm">Celkem {filteredItems.length} {filteredItems.length === 1 ? "úkon" : filteredItems.length >= 2 && filteredItems.length <= 4 ? "úkony" : "úkonů"}</span>

                    <Tooltip delay={0}>
                        <Tooltip.Trigger>
                            <Button
                                isIconOnly
                                variant="ghost"
                                size="sm"
                                className="rounded-full"
                                onPress={handleOpenReceiptModal}
                                isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                            >
                                <Printer className="size-5" />
                            </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content placement="bottom">
                            Vygenerovat stvrzenku
                        </Tooltip.Content>
                    </Tooltip>
                </div>
            </div>
        );
    }, [
        filterValue,
        departmentFilter,
        caregiverFilter,
        filteredItems.length,
        performedTasks.length,
        onSearchChange,
        onClear,
        departmentOptions,
        caregiverOptions,
        handleDepartmentFilterChange,
        handleCaregiverFilterChange,
        handleOpenFiltersModal,
        user,
        superadminOrg,
    ]);

    const renderCell = React.useCallback((performedTask, columnKey) => {
        const cellValue = performedTask[columnKey];

        switch (columnKey) {
            case "date":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{formatDateTime(performedTask.date)}</p>
                    </div>
                );
            case "task":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">{performedTask.taskName}</p>
                    </div>
                );
            case "client":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">
                            {performedTask.clientName}
                        </p>
                    </div>
                );
            case "unitCount":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">
                            {formatNumber(cellValue)} {unitTypeTranslations[performedTask.unitType] || "-"}
                        </p>
                    </div>
                );
            case "price":
                return (
                    <div className="flex flex-col">
                        <p className="text-sm">
                            {formatNumber(cellValue)} Kč
                        </p>
                    </div>
                );
            case "actions": {
                const canEdit = user?.role !== 'CAREGIVER' ||
                    performedTask.caregivers?.some(c => c.id === user.employeeId);
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
                                                       textValue="Detail"
                                                       onAction={() => handleOpenDetailModal(performedTask.id)}
                                        >
                                            <ClipboardList />
                                            <Label>{isLoadingDetail ? "Načítání..." : "Detail"}</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Section>
                                    {canEdit && (
                                        <>
                                            <Separator />
                                            <Dropdown.Section>
                                                <Dropdown.Item id="delete"
                                                               textValue="Smazat"
                                                               variant="danger"
                                                               onAction={() => handleOpenDeleteModal(performedTask.id)}
                                                >
                                                    <Trash2 />
                                                    <Label>Smazat</Label>
                                                </Dropdown.Item>
                                            </Dropdown.Section>
                                        </>
                                    )}
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>
                    </div>
                );
            }
            default:
                return cellValue || "-";
        }
    }, [user, isLoadingDetail]);

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
                        aria-label="Performed tasks table"
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
                                        <p className="text-sm text-foreground/60">Načítání úkonů...</p>
                                    </div>
                                ) : (
                                    <p>
                                        {isSuperadminWithoutOrg
                                            ? "Vyberte prosím organizaci v navigační liště" : "Žádné provedené úkony nenalezeny"}
                                    </p>
                                )
                            )}
                        >
                            {(item) => (
                                <Table.Row key={item.id}>
                                    {(columnKey) => <Table.Cell>{renderCell(item, columnKey)}</Table.Cell>}
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>

            <PerformedTaskCreateModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onSubmit={handleCreatePerformedTask}
                clients={filteredClients}
                caregivers={filteredEmployees}
                tasks={tasks}
            />

            <PerformedTaskDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                onSubmit={handleUpdatePerformedTask}
                isLoading={isLoadingDetail}
                performedTask={selectedPerformedTask}
                clients={filteredClients}
                caregivers={filteredEmployees}
                tasks={tasks}
                readOnly={user?.role === 'CAREGIVER' && !selectedPerformedTask?.caregivers?.some(c => c.id === user.employeeId)}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onSubmit={handleDeletePerformedTask}
                itemId={selectedPerformedTask?.id}
                title="Smazat vykonaný úkon"
                message="Opravdu chcete smazat tento vykonaný úkon?"
            />

            <GenerateReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={handleCloseReceiptModal}
                clients={filteredClients}
            />

            <FiltersModal
                isOpen={isFiltersModalOpen}
                onClose={handleCloseFiltersModal}
                onSubmit={handleFiltersChange}
                user={user}
                superadminOrgSelected={!!superadminOrg}
                initialDepartmentFilter={departmentFilter}
                initialCaregiverFilter={caregiverFilter}
                departmentOptions={departmentOptions}
                caregiverOptions={caregiverOptions}
                showMonthYearFilter={true}
                initialMonthYearFilter={monthYearFilter}
            />
        </>
    );
}

export default PerformedTasks;