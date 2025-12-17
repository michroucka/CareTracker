import React from "react";
import {useAuth} from "../contexts/AuthContext.tsx";
import {useClients} from "../hooks/useClients.jsx";
import {useDepartments} from "../hooks/useDepartments.jsx";
import {useEmployees} from "../hooks/useEmployees.jsx";
import {useTasks} from "../hooks/useTasks.jsx";
import {useIsMobile} from "../hooks/useMediaQuery.js";
import {columns, unitTypeTranslations} from "../constants/performedTaskConstants.js"
import {removeDiacritics, formatDateTime} from "../utils/formatters.js";
import {sortByKey} from "../utils/sorting.js";
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Input,
    Spinner,
    Table, TableBody, TableCell, TableColumn,
    TableHeader, TableRow
} from "@heroui/react";
import {
    ChevronDown,
    MoreVertical,
    Plus,
    Search,
    Trash2,
    Eye
} from "lucide-react";
import {usePerformedTasks} from "../hooks/usePerformedTasks.jsx";
import {PerformedTaskCreateModal} from "../components/modals/performedTask/PerformedTaskCreateModal.jsx";

function PerformedTasks() {
    const { user } = useAuth();
    const {
        performedTasks,
        loading,
        fetchPerformedTasks,
        createPerformedTask,
    } = usePerformedTasks();
    const { clients, fetchClients } = useClients();
    const { departments, fetchDepartments } = useDepartments();
    const { employees, fetchEmployees } = useEmployees();
    const { tasks, fetchTasks } = useTasks();

    const [filterValue, setFilterValue] = React.useState("");
    const [departmentFilter, setDepartmentFilter] = React.useState(new Set(["all"]));
    const [caregiverFilter, setCaregiverFilter] = React.useState(new Set(["all"]));
    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "date",
        direction: "descending",
    });
    const [maxTableHeight, setMaxTableHeight] = React.useState("calc(100dvh - 16rem)");
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [selectedPerformedTask, setSelectedPerformedTask] = React.useState(null);

    // Detekce mobilního zobrazení
    const isMobile = useIsMobile();

    // Filtrované sloupce pro mobile
    const visibleColumns = React.useMemo(() => {
        if (isMobile) {
            return columns.filter(col => ["client", "task", "date", "actions"].includes(col.key));
        }
        return columns;
    }, [isMobile]);

    React.useEffect(() => {
        fetchPerformedTasks();
        fetchClients();
        fetchDepartments();
        fetchEmployees();
        fetchTasks();
    }, []);

    // Nastavení defaultního filtru podle department uživatele
    React.useEffect(() => {
        if (user?.departmentId && departments.length > 0) {
            const userDepartment = departments.find(dept => dept.id === user.departmentId);
            if (userDepartment) {
                setDepartmentFilter(new Set([userDepartment.name]));
            }
        }
    }, [user, departments]);

    // Dynamická výška tabulky podle velikosti obrazovky
    React.useEffect(() => {
        setMaxTableHeight(isMobile ? "calc(100dvh - 13rem)" : "calc(100dvh - 16rem)");
    }, [isMobile]);

    const hasSearchFilter = Boolean(filterValue);

    const departmentOptions = React.useMemo(() => {
        return departments.map(dept => ({
            name: dept.name,
            key: dept.name
        }));
    }, [departments]);

    const caregiverOptions = React.useMemo(() => {
        return employees.map(emp => {
            const fullName = `${emp.firstName} ${emp.lastName}`;
            return {
                name: fullName,
                key: fullName
            };
        });
    }, [employees]);

    const filteredClients = React.useMemo(() => {
        if (departmentFilter.has("all")) {
            return clients;
        }
        return clients.filter(client =>
            departmentFilter.has(client.department?.name)
        );
    }, [clients, departmentFilter]);

    const filteredEmployees = React.useMemo(() => {
        if (departmentFilter.has("all")) {
            return employees;
        }
        return employees.filter(employee =>
            departmentFilter.has(employee.department?.name)
        );
    }, [employees, departmentFilter]);

    const filteredItems = React.useMemo(() => {
        let filteredPerformedTasks = [...performedTasks];

        // Filtr podle jména (s podporou diakritiky)
        if (hasSearchFilter) {
            const normalizedSearchValue = removeDiacritics(filterValue);
            filteredPerformedTasks = filteredPerformedTasks.filter((performedTask) =>
                removeDiacritics(
                    performedTask.client.firstName + " " + performedTask.client.lastName
                ).includes(normalizedSearchValue),
            );
        }

        // Filtr podle oddělení
        if (!departmentFilter.has("all")) {
            filteredPerformedTasks = filteredPerformedTasks.filter((performedTask) =>
                departmentFilter.has(performedTask.department?.name),
            );
        }

        // Filtr podle pečovatele (může být víc pečovatelů u jednoho úkonu)
        if (!caregiverFilter.has("all")) {
            filteredPerformedTasks = filteredPerformedTasks.filter((performedTask) => {
                // Zkontroluj, jestli alespoň jeden caregiver odpovídá filtru
                return performedTask.caregivers?.some(caregiver => {
                    const caregiverName = `${caregiver.firstName} ${caregiver.lastName}`;
                    return caregiverFilter.has(caregiverName);
                });
            });
        }

        return filteredPerformedTasks;
    }, [performedTasks, filterValue, hasSearchFilter, departmentFilter, caregiverFilter]);

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

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%]"
                        placeholder="Hledat podle klienta..."
                        startContent={<Search className="size-5" />}
                        value={filterValue}
                        onClear={() => onClear()}
                        onValueChange={onSearchChange}
                    />
                    <div className="flex gap-3">
                        {user.role !== "CAREGIVER" && (
                            <Dropdown>
                                <DropdownTrigger className="hidden sm:flex">
                                    <Button endContent={<ChevronDown className="size-4" />} variant="flat" className="text-foreground">
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
                                <Button endContent={<ChevronDown className="size-4" />} variant="flat" className="text-foreground">
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

                        <Button color="primary"
                                endContent={<Plus className="size-4" />}
                                onPress={handleOpenCreateModal}
                        >
                            Přidat
                        </Button>
                    </div>
                </div>
                <div className="flex flex-row justify-start items-center">
                    <span className="text-small">Celkem {filteredItems.length} úkonů</span>
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
    ]);

    const renderCell = React.useCallback((performedTask, columnKey) => {
        const cellValue = performedTask[columnKey];

        switch (columnKey) {
            case "date":
                return (
                    <div className="flex flex-col">
                        <p className="text-small">{formatDateTime(performedTask.date)}</p>
                    </div>
                );
            case "task":
                return (
                    <div className="flex flex-col">
                        <p className="text-small">{performedTask.task?.name}</p>
                    </div>
                );
            case "client":
                return (
                    <div className="flex flex-col">
                        <p className="text-small">
                            {performedTask.client?.firstName} {performedTask.client?.lastName}
                        </p>
                    </div>
                );
            case "unitCount":
                return (
                    <div className="flex flex-col">
                        <p className="text-small">
                            {cellValue}x {unitTypeTranslations[performedTask.task?.unitType].toLowerCase() || "-"}
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
                                <DropdownItem key="view"
                                              startContent={<Eye />}
                                              variant="light"
                                >
                                    Detail
                                </DropdownItem>

                                <DropdownItem key="delete"
                                              startContent={<Trash2 />}
                                              variant="light"
                                              color="danger"
                                >
                                    Smazat
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return cellValue || "-";
        }
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100dvh-20rem)]">
                <Spinner size="lg" variant="gradient" label="Načítání úkonů..." />
            </div>
        );
    }

    return (
        <>
            <Table
                isVirtualized
                aria-label="Performed tasks table"
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
                <TableBody emptyContent={"Žádné provedené úkony nenalezeny"} items={sortedItems}>
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <PerformedTaskCreateModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onSubmit={handleCreatePerformedTask}
                clients={filteredClients}
                caregivers={filteredEmployees}
                tasks={tasks}
            />
        </>
    );
}

export default PerformedTasks;