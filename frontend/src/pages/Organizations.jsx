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
    Ban,
    Building2, Check,
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
import { useEmployees } from "../hooks/useEmployees.jsx";
import { DepartmentCreateModal } from "../components/modals/department/DepartmentCreateModal.jsx";
import { DepartmentDetailModal } from "../components/modals/department/DepartmentDetailModal.jsx";
import { DepartmentTerminateModal } from "../components/modals/department/DepartmentTerminateModal.jsx";
import {useOrganizations} from "../hooks/useOrganizations.jsx";
import {OrganizationCreateModal} from "../components/modals/organization/OrganizationCreateModal.jsx";
import {OrganizationDetailModal} from "../components/modals/organization/OrganizationDetailModal.jsx";
import {OrganizationTerminateModal} from "../components/modals/organization/OrganizationTerminateModal.jsx";

const columns = [
    { name: "NÁZEV", key: "name", sortable: true },
    { name: "VEDOUCÍ", key: "manager" },
    { name: "AKCE", key: "actions" },
];

function Organizations() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();

    const getInitialFilterValue = () => searchParams.get("search") || "";
    const getInitialActiveFilter = () => {
        const status = searchParams.get("status");
        if (status === null) return new Set(["true"]);
        if (status === "all") return new Set(["true", "false"]);
        return new Set([status]);
    };

    const [filterValue, setFilterValue] = React.useState(getInitialFilterValue);
    const [activeFilter, setActiveFilter] = React.useState(getInitialActiveFilter);
    const [sortDescriptor, setSortDescriptor] = React.useState({ column: "name", direction: "ascending" });
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
    const [isTerminateModalOpen, setIsTerminateModalOpen] = React.useState(false);
    const [selectedOrganization, setSelectedOrganization] = React.useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
    const [isFiltersModalOpen, setIsFiltersModalOpen] = React.useState(false);

    const {
        organizations,
        loading,
        fetchOrganizations,
        fetchOrganization,
        createOrganization,
        updateOrganization,
        terminateOrganization,
        activateOrganization,
    } = useOrganizations();

    const { employees, fetchEmployees } = useEmployees();

    const isMobile = useIsMobile();

    const visibleColumns = React.useMemo(() => {
        if (isMobile) return columns.filter(col => col.key === "name" || col.key === "actions");
        return columns;
    }, [isMobile]);

    const filteredItems = React.useMemo(() => {
        if (!filterValue) return [...organizations];
        const normalized = removeDiacritics(filterValue);
        return organizations.filter(o => removeDiacritics(o.name).includes(normalized));
    }, [organizations, filterValue]);

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
        fetchOrganizations({ status: getStatusFromFilter(activeFilter) });
    }, [activeFilter]);

    function getStatusFromFilter(filter) {
        if (filter.size === 0 || filter.size === 2) return undefined;
        return filter.has("true");
    }

    async function handleSelectOrganization(id) {
        const data = await fetchOrganization(id);
        fetchEmployees({ orgId: id });
        setSelectedOrganization(data);
    }

    const handleOpenDetailModal = async (id) => {
        setIsLoadingDetail(true);
        setIsDetailModalOpen(true);
        try {
            await handleSelectOrganization(id);
        } catch {
            setIsDetailModalOpen(false);
        }
        setIsLoadingDetail(false);
    };

    const handleCloseDetailModal = () => {
        setSelectedOrganization(null);
        setIsDetailModalOpen(false);
    };

    const handleOpenTerminateModal = async (id) => {
        setIsTerminateModalOpen(true);
        try {
            await handleSelectOrganization(id);
        } catch {
            setIsTerminateModalOpen(false);
        }
    };

    const handleCloseTerminateModal = () => {
        setSelectedOrganization(null);
        setIsTerminateModalOpen(false);
    };

    const handleCreate = async (data) => {
        await createOrganization(data);
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
                    <Button color="primary" endContent={<Plus className="size-4" />} onPress={() => setIsCreateModalOpen(true)}>
                        Přidat
                    </Button>
                </div>
            </div>
            <span className="text-small">Celkem {filteredItems.length} {filteredItems.length === 1 ? "organizace" : filteredItems.length >= 2 && filteredItems.length <= 4 ? "organizace" : "organizací"}</span>
        </div>
    ), [filterValue, activeFilter, filteredItems.length, onSearchChange, onClear]);

    const renderCell = React.useCallback((organization, columnKey) => {
        const cellValue = organization[columnKey];

        switch (columnKey) {
            case "name":
                return <p className="font-bold text-small">{cellValue}</p>;
            case "manager":
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
                                        onPress={() => handleOpenDetailModal(organization.id)}
                                    >
                                        {isLoadingDetail ? "Načítání..." : "Detail"}
                                    </DropdownItem>
                                </DropdownSection>
                                <DropdownSection>
                                    {organization.active ? (
                                        <DropdownItem
                                            key="terminate"
                                            startContent={<Ban />}
                                            variant="light"
                                            color="danger"
                                            onPress={() => handleOpenTerminateModal(organization.id)}
                                        >
                                            Deaktivovat
                                        </DropdownItem>
                                    ) : (
                                        <DropdownItem
                                            key="activate"
                                            startContent={<Check />}
                                            variant="light"
                                            color="success"
                                            onPress={() => activateOrganization(organization.id)}
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

    return (
        <>
            <Table
                isHeaderSticky
                removeWrapper
                                aria-label="Organizations table"
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
                                "end" : "start"}
                            allowsSorting={column.sortable}
                        >
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    isLoading={loading}
                    loadingContent={<Spinner className="mt-72" label="Načítání organizace..." />}
                    emptyContent="Žádná organizace nenalezena"
                    items={sortedItems}
                >
                    {(item) => (
                        <TableRow key={item.id} className={!item.active ? "opacity-50" : ""}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <OrganizationCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreate}
                employees={employees}
            />
            
            <OrganizationDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                onSubmit={updateOrganization}
                organization={selectedOrganization}
                isLoading={isLoadingDetail}
                employees={employees}
            />
            
            <OrganizationTerminateModal
                isOpen={isTerminateModalOpen}
                onClose={handleCloseTerminateModal}
                onSubmit={terminateOrganization}
                organizationId={selectedOrganization?.id}
                organizationName={selectedOrganization?.name}
            />

            <FiltersModal
                isOpen={isFiltersModalOpen}
                onClose={() => setIsFiltersModalOpen(false)}
                onSubmit={({ activeFilter: f }) => setActiveFilter(f)}
                user={user}
                showStatusFilter
                initialActiveFilter={activeFilter}
                activeOptions={activeOptions}
            />
        </>
    );
}

export default Organizations;
