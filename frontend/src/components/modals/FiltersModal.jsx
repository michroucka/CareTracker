import React from "react";
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader
} from "@heroui/react";
import {ChevronDown, Funnel} from "lucide-react";

export function FiltersModal({
                                 isOpen,
                                 onClose,
                                 onSubmit,
                                 user,
                                 showStatusFilter = false,
                                 initialActiveFilter,
                                 activeOptions,
                                 initialOrganizationFilter,
                                 organizationOptions,
                                 initialDepartmentFilter,
                                 departmentOptions,
                                 initialCaregiverFilter,
                                 caregiverOptions,
                             }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const [activeFilter, setActiveFilter] = React.useState(initialActiveFilter || new Set());
    const [organizationFilter, setOrganizationFilter] = React.useState(initialOrganizationFilter || new Set());
    const [departmentFilter, setDepartmentFilter] = React.useState(initialDepartmentFilter || new Set(["all"]));
    const [caregiverFilter, setCaregiverFilter] = React.useState(initialCaregiverFilter || new Set(["all"]));

    // Reset local state when modal opens with new initial values
    React.useEffect(() => {
        if (isOpen) {
            if (initialActiveFilter !== undefined) setActiveFilter(initialActiveFilter);
            if (initialOrganizationFilter !== undefined) setOrganizationFilter(initialOrganizationFilter);
            if (initialDepartmentFilter !== undefined) setDepartmentFilter(initialDepartmentFilter);
            if (initialCaregiverFilter !== undefined) setCaregiverFilter(initialCaregiverFilter);
        }
    }, [isOpen, initialActiveFilter, initialOrganizationFilter, initialDepartmentFilter, initialCaregiverFilter]);

    // Handler pro změnu organization filtru (single select)
    const handleOrganizationFilterChange = React.useCallback((keys) => {
        setOrganizationFilter(new Set(keys));
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

    async function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();

        setIsSubmitting(true);

        try {
            if (onSubmit) {
                await onSubmit({
                    activeFilter,
                    organizationFilter,
                    departmentFilter,
                    caregiverFilter,
                });
            }
            onClose();
        } catch (error) {
            console.error("Error submitting filters:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" scrollBehavior="outside">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Filtry</ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-4 w-full">
                        {user?.role === "SUPERADMIN" && organizationOptions && organizationOptions.length > 0 && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button endContent={<ChevronDown className="size-4" />} variant="flat" className="text-foreground w-full justify-between">
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

                        {/* Status filter - only if showStatusFilter is true */}
                        {showStatusFilter && activeOptions && activeOptions.length > 0 && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        endContent={<ChevronDown className="size-4" />}
                                        variant="flat"
                                        className="text-foreground w-full justify-between"
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

                        {/* Department filter - not for CAREGIVER/COORDINATOR */}
                        {!['CAREGIVER', 'COORDINATOR'].includes(user?.role) && departmentOptions && departmentOptions.length > 0 && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        endContent={<ChevronDown className="size-4" />}
                                        variant="flat"
                                        className="text-foreground w-full justify-between"
                                        isDisabled={user?.role === "SUPERADMIN" && organizationFilter.size === 0}
                                    >
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

                        {/* Caregiver filter - only if caregiverOptions provided */}
                        {caregiverOptions && caregiverOptions.length > 0 && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        endContent={<ChevronDown className="size-4" />}
                                        variant="flat"
                                        className="text-foreground w-full justify-between"
                                        isDisabled={user?.role === "SUPERADMIN" && organizationFilter.size === 0}
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
                        )}
                    </div>
                </ModalBody>
                <ModalFooter className="justify-between">
                    <Button
                        className="text-base"
                        variant="flat"
                        isDisabled={isSubmitting}
                        onPress={onClose}
                    >
                        Zrušit
                    </Button>
                    <Button
                        className="text-base"
                        color="primary"
                        isLoading={isSubmitting}
                        isDisabled={isSubmitting}
                        endContent={<Funnel className="size-4" />}
                        onPress={handleSubmit}
                    >
                        {isSubmitting ? "Aplikování..." : "Použít filtry"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}