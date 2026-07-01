import React from "react";
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
    Ban, Building2, Check,
    ChevronDown,
    Eye,
    Funnel,
    MoreVertical,
    Plus,
    Search,
    UserRound,
    UserRoundCheck,
    UserRoundX
} from "lucide-react";
import { useIsMobile } from "../hooks/useMediaQuery.js";
import { activeOptions } from '../constants/globalConstants.js';
import { useAuth } from "../contexts/AuthContext.tsx";
import { removeDiacritics } from "../utils/formatters.js";
import { sortByKey } from "../utils/sorting.js";
import { FiltersModal } from "../components/modals/FiltersModal.jsx";
import { useSearchParams } from "react-router-dom";
import { useDepartments } from "../hooks/useDepartments.jsx";
import { useEmployees } from "../hooks/useEmployees.jsx";
import { DepartmentCreateModal } from "../components/modals/department/DepartmentCreateModal.jsx";
import { DepartmentDetailModal } from "../components/modals/department/DepartmentDetailModal.jsx";
import { DepartmentTerminateModal } from "../components/modals/department/DepartmentTerminateModal.jsx";

const columns = [
    { name: "MĚSTO", key: "city", sortable: true },
    { name: "ADRESA", key: "street" },
    { name: "PSČ", key: "postalCode" },
    { name: "ČÍSLO", key: "departmentNumber" },
    { name: "KOORDINÁTOR", key: "coordinator" },
    { name: "AKCE", key: "actions" },
];

function Departments() {
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
    const [sortDescriptor, setSortDescriptor] = React.useState({ column: "city", direction: "ascending" });
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
    const [isTerminateModalOpen, setIsTerminateModalOpen] = React.useState(false);
    const [selectedDepartment, setSelectedDepartment] = React.useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
    const [isFiltersModalOpen, setIsFiltersModalOpen] = React.useState(false);

    const {
        departments,
        setDepartments,
        loading,
        fetchDepartments,
        fetchDepartment,
        createDepartment,
        updateDepartment,
        terminateDepartment,
        activateDepartment,
    } = useDepartments();

    const { employees, fetchEmployees } = useEmployees();

    const availableCoordinators = React.useMemo(() => {
        return employees.filter(e => e.role !== "COORDINATOR");
    }, [employees]);

    const availableCoordinatorsForEdit = React.useMemo(() => {
        const currentCoordinatorId = selectedDepartment?.coordinator?.id;
        return employees.filter(e => e.role !== "COORDINATOR" || e.id === currentCoordinatorId);
    }, [employees, selectedDepartment]);

    const isMobile = useIsMobile();

    const visibleColumns = React.useMemo(() => {
        if (isMobile) return columns.filter(col => col.key === "city" || col.key === "actions");
        return columns;
    }, [isMobile]);

    const filteredItems = React.useMemo(() => {
        if (!filterValue) return [...departments];
        const normalized = removeDiacritics(filterValue);
        return departments.filter(d => removeDiacritics(d.city).includes(normalized));
    }, [departments, filterValue]);

    const sortedItems = React.useMemo(() => {
        return sortByKey(filteredItems, sortDescriptor.column, sortDescriptor.direction);
    }, [sortDescriptor, filteredItems]);

    const onSearchChange = React.useCallback((value) => setFilterValue(value || ""), []);
    const onClear = React.useCallback(() => setFilterValue(""), []);


    React.useEffect(() => {
        if (!user) return;
        const params = new URLSearchParams();
        if (filterValue) params.set("search", filterValue);
        if (activeFilter.size === 2) params.set("status", "all");
        else if (activeFilter.has("true")) params.set("status", "true");
        else if (activeFilter.has("false")) params.set("status", "false");
        setSearchParams(params, { replace: true });
    }, [filterValue, activeFilter, user]);

    React.useEffect(() => {
        if (user?.role === "SUPERADMIN" && !superadminOrg) {
            setDepartments([]);
            return;
        }
        const orgId = superadminOrg?.id;
        fetchDepartments({ organizationId: orgId, status: getStatusFromFilter(activeFilter) });
        fetchEmployees({ organizationId: orgId, status: true });
    }, [superadminOrg, activeFilter, user]);

    function getStatusFromFilter(filter) {
        if (filter.size === 0 || filter.size === 2) return undefined;
        return filter.has("true");
    }

    async function handleSelectDepartment(id) {
        const data = await fetchDepartment(id);
        setSelectedDepartment(data);
    }

    const handleOpenDetailModal = async (id) => {
        setIsLoadingDetail(true);
        setIsDetailModalOpen(true);
        try {
            await handleSelectDepartment(id);
        } catch {
            setIsDetailModalOpen(false);
        }
        setIsLoadingDetail(false);
    };

    const handleCloseDetailModal = () => {
        setSelectedDepartment(null);
        setIsDetailModalOpen(false);
    };

    const handleOpenTerminateModal = async (id) => {
        setIsTerminateModalOpen(true);
        try {
            await handleSelectDepartment(id);
        } catch {
            setIsTerminateModalOpen(false);
        }
    };

    const handleCloseTerminateModal = () => {
        setSelectedDepartment(null);
        setIsTerminateModalOpen(false);
    };

    const handleCreate = async (data) => {
        await createDepartment(data);
        setIsCreateModalOpen(false);
    };

    const topContent = React.useMemo(() => (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Hledat podle názvu..."
                    startContent={<Search className="size-5" />}
                    value={filterValue}
                    onClear={onClear}
                    onValueChange={onSearchChange}
                    isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                />
                <div className="flex gap-3">
                    <Button isIconOnly variant="flat" className="sm:hidden" onPress={() => setIsFiltersModalOpen(true)}>
                        <Funnel className="size-4" />
                    </Button>
                    <Dropdown>
                        <DropdownTrigger className="hidden sm:flex">
                            <Button
                                endContent={<ChevronDown className="size-4" />}
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
                                <DropdownItem key={active.key}>{active.name}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <Button
                        color="primary"
                        endContent={<Plus className="size-4" />}
                        onPress={() => setIsCreateModalOpen(true)}
                        isDisabled={user?.role === "SUPERADMIN" && !superadminOrg}
                    >
                        Přidat
                    </Button>
                </div>
            </div>
            <span className="text-small">Celkem {filteredItems.length} {filteredItems.length === 1 ? "středisko" : filteredItems.length >= 2 && filteredItems.length <= 4 ? "střediska" : "středisek"}</span>
        </div>
    ), [filterValue, activeFilter, filteredItems.length, onSearchChange, onClear, user, superadminOrg]);

    const renderCell = React.useCallback((department, columnKey) => {
        const cellValue = department[columnKey];

        switch (columnKey) {
            case "name":
                return <p className="font-bold text-small">{cellValue}</p>;
            case "coordinator":
                return <p className="text-small">{cellValue?.fullName || "-"}</p>;
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
                                <DropdownSection showDivider>
                                    <DropdownItem
                                        key="view"
                                        startContent={<Building2 />}
                                        variant="light"
                                        isLoading={isLoadingDetail}
                                        onPress={() => handleOpenDetailModal(department.id)}
                                    >
                                        {isLoadingDetail ? "Načítání..." : "Detail"}
                                    </DropdownItem>
                                </DropdownSection>
                                <DropdownSection>
                                    {department.active ? (
                                        <DropdownItem
                                            key="terminate"
                                            startContent={<Ban />}
                                            variant="light"
                                            color="danger"
                                            onPress={() => handleOpenTerminateModal(department.id)}
                                        >
                                            Deaktivovat
                                        </DropdownItem>
                                    ) : (
                                        <DropdownItem
                                            key="activate"
                                            startContent={<Check />}
                                            variant="light"
                                            color="success"
                                            onPress={() => activateDepartment(department.id)}
                                        >
                                            Aktivovat
                                        </DropdownItem>
                                    )}
                                </DropdownSection>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return cellValue ?? "-";
        }
    }, [isLoadingDetail]);

    const isSuperadminWithoutOrg = user?.role === "SUPERADMIN" && !superadminOrg;
    const shouldShowLoading = !isSuperadminWithoutOrg && loading;

    return (
        <>
            <Table
                isHeaderSticky
                removeWrapper
                                aria-label="Departments table"
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
                                "end" :
                                column.key === "departmentNumber" ?
                                    "center" : "start"}
                            allowsSorting={column.sortable}
                        >
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    isLoading={shouldShowLoading}
                    loadingContent={<Spinner className="mt-72" label="Načítání středisek..." />}
                    emptyContent={isSuperadminWithoutOrg ? "Vyberte prosím organizaci v navigační liště" : "Žádná střediska nenalezena"}
                    items={sortedItems}
                >
                    {(item) => (
                        <TableRow key={item.id} className={!item.active ? "opacity-50" : ""}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <DepartmentCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreate}
                employees={availableCoordinators}
                organizationId={superadminOrg?.id}
            />

            <DepartmentDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                onSubmit={updateDepartment}
                department={selectedDepartment}
                isLoading={isLoadingDetail}
                employees={availableCoordinatorsForEdit}
                organizationId={superadminOrg?.id}
            />

            <DepartmentTerminateModal
                isOpen={isTerminateModalOpen}
                onClose={handleCloseTerminateModal}
                onSubmit={terminateDepartment}
                departmentId={selectedDepartment?.id}
                departmentName={selectedDepartment?.city}
            />

            <FiltersModal
                isOpen={isFiltersModalOpen}
                onClose={() => setIsFiltersModalOpen(false)}
                onSubmit={({ activeFilter: f }) => setActiveFilter(f)}
                user={user}
                superadminOrgSelected={!!superadminOrg}
                showStatusFilter
                initialActiveFilter={activeFilter}
                activeOptions={activeOptions}
            />
        </>
    );
}

export default Departments;
