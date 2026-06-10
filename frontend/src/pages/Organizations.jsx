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
                <TextField
                    className="w-full sm:max-w-[44%]"
                >
                    <InputGroup>
                        <InputGroup.Prefix><Search className="size-5 opacity-50" /></InputGroup.Prefix>
                        <InputGroup.Input
                            placeholder="Hledat podle názvu..."
                            value={filterValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </InputGroup>
                </TextField>
                <div className="flex gap-3">
                    <Button isIconOnly variant="tertiary" className="sm:hidden" onPress={() => setIsFiltersModalOpen(true)}>
                        <Funnel className="size-4" />
                    </Button>
                    <Dropdown>
                        <Button
                            variant="tertiary"
                            className="hidden sm:flex text-foreground"
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
                    <Button variant="primary" onPress={() => setIsCreateModalOpen(true)}>Přidat <Plus className="size-4" /></Button>
                </div>
            </div>
            <span className="text-sm">Celkem {filteredItems.length} {filteredItems.length === 1 ? "organizace" : filteredItems.length >= 2 && filteredItems.length <= 4 ? "organizace" : "organizací"}</span>
        </div>
    ), [filterValue, activeFilter, filteredItems.length, onSearchChange, onClear]);

    const renderCell = React.useCallback((organization, columnKey) => {
        const cellValue = organization[columnKey];

        switch (columnKey) {
            case "name":
                return <p className="font-bold text-sm">{cellValue}</p>;
            case "manager":
                return <p className="text-sm">{cellValue?.fullName || "-"}</p>;
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
                                        <Dropdown.Item
                                            id="view"
                                            textValue="Detail"
                                            onAction={() => handleOpenDetailModal(organization.id)}
                                        >
                                            <Building2 />
                                            <Label>{isLoadingDetail ? "Načítání..." : "Detail"}</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Section>
                                    <Separator />
                                    <Dropdown.Section>
                                        {organization.active ? (
                                            <Dropdown.Item
                                                id="terminate"
                                                textValue="Deaktivovat"
                                                variant="danger"
                                                onAction={() => handleOpenTerminateModal(organization.id)}
                                            >
                                                <Ban />
                                                <Label>Deaktivovat</Label>
                                            </Dropdown.Item>
                                        ) : (
                                            <Dropdown.Item
                                                id="activate"
                                                textValue="Aktivovat"
                                                className="text-success"
                                                onAction={() => activateOrganization(organization.id)}
                                            >
                                                <Check />
                                                <Label>Aktivovat</Label>
                                            </Dropdown.Item>
                                        )}
                                    </Dropdown.Section>
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>
                    </div>
                );
            default:
                return cellValue ?? "-";
        }
    }, [isLoadingDetail]);

    return (
        <>
            {topContent}
            <Table>
                <Table.ScrollContainer>
                    <Table.Content
                        aria-label="Organizations table"
                        sortDescriptor={sortDescriptor}
                        onSortChange={setSortDescriptor}
                    >
                        <Table.Header columns={visibleColumns} className="sticky top-0 bg-background z-10">
                            {(column) => (
                                <Table.Column
                                    key={column.key}
                                    align={column.key === "actions" ?
                                        "end" : "start"}
                                    allowsSorting={column.sortable}
                                >
                                    {column.name}
                                </Table.Column>
                            )}
                        </Table.Header>
                        <Table.Body
                            items={loading ? [] : sortedItems}
                            renderEmptyState={() => (
                                loading ? (
                                    <div className="flex flex-col items-center gap-2 mt-72">
                                        <Spinner />
                                        <p className="text-sm text-foreground/60">Načítání organizace...</p>
                                    </div>
                                ) : (
                                    <p>Žádná organizace nenalezena</p>
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
