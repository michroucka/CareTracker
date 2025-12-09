import React from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Spinner,
} from "@heroui/react";
import { MagnifyingGlassIcon, EllipsisVerticalIcon, PlusIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
import { getJSON } from "../api/api.js";
import { columns, genderOptions, genderTranslations } from "../constants/clientConstants.js";

function Clients() {
    const [filterValue, setFilterValue] = React.useState("");
    const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
    const [genderFilter, setGenderFilter] = React.useState(new Set(["all"]));
    const [departmentFilter, setDepartmentFilter] = React.useState(new Set(["all"]));
    const [caregiverFilter, setCaregiverFilter] = React.useState(new Set(["all"]));
    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "name",
        direction: "descending",
    });
    const [maxTableHeight, setMaxTableHeight] = React.useState("calc(100dvh - 16rem)");
    const [clients, setClients] = React.useState([])
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchClients = async () => {
            try {
                setLoading(true);
                const clients = await getJSON("/clients");

                // Mapuj data z backendu DTO
                const mappedClients = clients.map(client => ({
                    id: client.id,
                    name: `${client.firstName} ${client.lastName}`,
                    gender: client.gender,
                    address: `${client.street}, ${client.city}`,
                    department: client.department,
                    caregiver: client.caregiver,
                }));

                setClients(mappedClients);
            } catch (err) {
                console.error("Error fetching clients:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    // Dynamická výška tabulky podle velikosti obrazovky
    React.useEffect(() => {
        const updateTableHeight = () => {
            const isMobile = window.innerWidth < 640; // Tailwind sm breakpoint
            setMaxTableHeight(isMobile ? "calc(100dvh - 13      rem)" : "calc(100dvh - 16rem)");
        };

        updateTableHeight();
        window.addEventListener('resize', updateTableHeight);

        return () => window.removeEventListener('resize', updateTableHeight);
    }, []);

    const hasSearchFilter = Boolean(filterValue);

    // Dynamické options pro department a caregiver
    const departmentOptions = React.useMemo(() => {
        const uniqueDepartments = [...new Set(clients
            .map(c => c.department?.name)
            .filter(Boolean))];
        return uniqueDepartments.map(name => ({
            name: name,
            uid: name
        }));
    }, [clients]);

    const caregiverOptions = React.useMemo(() => {
        const uniqueCaregivers = [...new Set(clients
            .map(c => c.caregiver ? `${c.caregiver.firstName} ${c.caregiver.lastName}` : null)
            .filter(Boolean))];
        return uniqueCaregivers.map(name => ({
            name: name,
            uid: name
        }));
    }, [clients]);

    const filteredItems = React.useMemo(() => {
        let filteredClients = [...clients];

        // Filtr podle jména
        if (hasSearchFilter) {
            filteredClients = filteredClients.filter((client) =>
                client.name.toLowerCase().includes(filterValue.toLowerCase()),
            );
        }

        // Filtr podle pohlaví
        if (!genderFilter.has("all")) {
            filteredClients = filteredClients.filter((client) =>
                genderFilter.has(client.gender),
            );
        }

        // Filtr podle oddělení
        if (!departmentFilter.has("all")) {
            filteredClients = filteredClients.filter((client) =>
                departmentFilter.has(client.department?.name),
            );
        }

        // Filtr podle pečovatele
        if (!caregiverFilter.has("all")) {
            filteredClients = filteredClients.filter((client) => {
                const caregiverName = client.caregiver
                    ? `${client.caregiver.firstName} ${client.caregiver.lastName}`
                    : null;
                return caregiverFilter.has(caregiverName);
            });
        }

        return filteredClients;
    }, [clients, filterValue, hasSearchFilter, genderFilter, departmentFilter, caregiverFilter]);

    const sortedItems = React.useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            const first = a[sortDescriptor.column];
            const second = b[sortDescriptor.column];
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? cmp : -cmp;
        });
    }, [sortDescriptor, filteredItems]);

    const renderCell = React.useCallback((client, columnKey) => {
        const cellValue = client[columnKey];

        switch (columnKey) {
            case "name":
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
                                    <EllipsisVerticalIcon className="size-6" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownItem key="view">Zobrazit</DropdownItem>
                                <DropdownItem key="edit">Upravit</DropdownItem>
                                <DropdownItem key="delete">Smazat</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return cellValue || "-";
        }
    }, []);

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

    // Handler pro změnu gender filtru
    const handleGenderFilterChange = React.useCallback((keys) => {
        const newKeys = new Set(keys);

        // Pokud jsme vybrali "all", odeber všechny ostatní
        if (newKeys.has("all") && !genderFilter.has("all")) {
            setGenderFilter(new Set(["all"]));
        }
        // Pokud vybereme něco jiného než "all", odeber "all"
        else if (newKeys.size > 1 && newKeys.has("all")) {
            newKeys.delete("all");
            setGenderFilter(newKeys);
        }
        // Pokud odznačíme všechny, vrať "all"
        else if (newKeys.size === 0) {
            setGenderFilter(new Set(["all"]));
        }
        else {
            setGenderFilter(newKeys);
        }
    }, [genderFilter]);

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

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%]"
                        placeholder="Hledat podle jména..."
                        startContent={<MagnifyingGlassIcon className="size-5" />}
                        value={filterValue}
                        onClear={() => onClear()}
                        onValueChange={onSearchChange}
                        classNames={{
                            inputWrapper: [
                                "bg-content2",
                                "data-[hover=true]:bg-content3",
                                "data-[focus=true]:bg-content3",
                            ],
                            label: [
                                "group-data-[filled-within=true]:text-foreground/75",
                            ],
                            input: [
                            ]
                        }}
                    />
                    <div className="flex gap-3">
                        <Dropdown>
                            <DropdownTrigger className="hidden sm:flex">
                                <Button endContent={<ChevronDownIcon className="size-4" />} variant="flat" className="text-foreground">
                                    Pohlaví
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                disallowEmptySelection
                                aria-label="Gender Filter"
                                closeOnSelect={false}
                                selectedKeys={genderFilter}
                                selectionMode="multiple"
                                onSelectionChange={handleGenderFilterChange}
                                className="max-h-60 overflow-y-auto"
                            >
                                <DropdownItem key="all">Všechny</DropdownItem>
                                {genderOptions.map((gender) => (
                                    <DropdownItem key={gender.uid}>
                                        {gender.name}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                        <Dropdown>
                            <DropdownTrigger className="hidden sm:flex">
                                <Button endContent={<ChevronDownIcon className="size-4" />} variant="flat" className="text-foreground">
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
                                    <DropdownItem key={dept.uid}>
                                        {dept.name}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                        <Dropdown>
                            <DropdownTrigger className="hidden sm:flex">
                                <Button endContent={<ChevronDownIcon className="size-4" />} variant="flat" className="text-foreground">
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
                                    <DropdownItem key={caregiver.uid}>
                                        {caregiver.name}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                        <Button color="primary" endContent={<PlusIcon className="size-4" />}>
                            Přidat
                        </Button>
                    </div>
                </div>
                <div className="flex flex-row justify-start items-center">
                    <span className="text-small">Celkem {clients.length} klientů</span>
                </div>
            </div>
        );
    }, [
        filterValue,
        genderFilter,
        departmentFilter,
        caregiverFilter,
        filteredItems.length,
        clients.length,
        onSearchChange,
        onClear,
        genderOptions,
        departmentOptions,
        caregiverOptions,
        handleGenderFilterChange,
        handleDepartmentFilterChange,
        handleCaregiverFilterChange,
    ]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100dvh-20rem)]">
                <Spinner size="lg" label="Načítání klientů..." />
            </div>
        );
    }

    return (
        <Table
            isVirtualized
            aria-label="Clients table"
            classNames={{
                th: "bg-content1",
            }}
            maxTableHeight={maxTableHeight}
            selectedKeys={selectedKeys}
            selectionMode="single"
            sortDescriptor={sortDescriptor}
            topContent={topContent}
            topContentPlacement="outside"
            onSelectionChange={setSelectedKeys}
            onSortChange={setSortDescriptor}
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn
                        key={column.uid}
                        align={column.uid === "actions" ? "end" : "start"}
                        allowsSorting={column.sortable}
                    >
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody emptyContent={"Žádní klienti nenalezeni"} items={sortedItems}>
                {(item) => (
                    <TableRow key={item.id}>
                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

export default Clients;

