import React from "react";
import {
    Button,
    Dropdown,
    Label,
    Modal,
} from "@heroui/react";
import {ChevronDown, Funnel} from "lucide-react";
import MonthYearPicker from "../MonthYearPicker.jsx";

export function FiltersModal({
                                 isOpen,
                                 onClose,
                                 onSubmit,
                                 user,
                                 superadminOrgSelected = true,
                                 showStatusFilter = false,
                                 initialActiveFilter,
                                 activeOptions,
                                 initialDepartmentFilter,
                                 departmentOptions,
                                 initialCaregiverFilter,
                                 caregiverOptions,
                                 showMonthYearFilter = false,
                                 initialMonthYearFilter,
                             }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const [activeFilter, setActiveFilter] = React.useState(initialActiveFilter || new Set());
    const [departmentFilter, setDepartmentFilter] = React.useState(initialDepartmentFilter || new Set(["all"]));
    const [caregiverFilter, setCaregiverFilter] = React.useState(initialCaregiverFilter || new Set(["all"]));
    const [monthYearFilter, setMonthYearFilter] = React.useState(initialMonthYearFilter);

    React.useEffect(() => {
        if (isOpen) {
            if (initialActiveFilter !== undefined) setActiveFilter(initialActiveFilter);
            if (initialDepartmentFilter !== undefined) setDepartmentFilter(initialDepartmentFilter);
            if (initialCaregiverFilter !== undefined) setCaregiverFilter(initialCaregiverFilter);
            if (initialMonthYearFilter !== undefined) setMonthYearFilter(initialMonthYearFilter);
        }
    }, [isOpen, initialActiveFilter, initialDepartmentFilter, initialCaregiverFilter]);

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

    async function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();

        setIsSubmitting(true);

        try {
            if (onSubmit) {
                await onSubmit({
                    activeFilter,
                    departmentFilter,
                    caregiverFilter,
                    monthYearFilter,
                });
            }
            onClose();
        } catch (error) {
            console.error("Error submitting filters:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const isSuperadminWithoutOrg = user?.role === "SUPERADMIN" && !superadminOrgSelected;

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Modal.Container size="sm">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex flex-col gap-1">
                            <Modal.Heading>Filtry</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="flex flex-col gap-4 w-full">
                            {showMonthYearFilter && (
                                <MonthYearPicker
                                    className="w-full"
                                    defaultValue={monthYearFilter}
                                    onChange={setMonthYearFilter}
                                    isDisabled={isSuperadminWithoutOrg}
                                />
                            )}
    
                            {showStatusFilter && activeOptions && activeOptions.length > 0 && (
                                <Dropdown>
                                    <Button
                                        variant="tertiary"
                                        className="text-foreground w-full justify-between"
                                        isDisabled={isSuperadminWithoutOrg}
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
    
                            {!['CAREGIVER', 'COORDINATOR'].includes(user?.role) && departmentOptions && departmentOptions.length > 0 && (
                                <Dropdown>
                                    <Button
                                        variant="tertiary"
                                        className="text-foreground w-full justify-between"
                                        isDisabled={isSuperadminWithoutOrg}
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
    
                            {caregiverOptions && caregiverOptions.length > 0 && (
                                <Dropdown>
                                    <Button
                                        variant="tertiary"
                                        className="text-foreground w-full justify-between"
                                        isDisabled={isSuperadminWithoutOrg}
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
                            )}
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="justify-between">
                            <Button
                                className="text-base"
                                variant="tertiary"
                                isDisabled={isSubmitting}
                                onPress={onClose}
                            >
                                Zrušit
                            </Button>
                            <Button variant="primary"
                                className="text-base"
                                isPending={isSubmitting}
                                isDisabled={isSubmitting}
                                onPress={handleSubmit}
                            >{isSubmitting ? "Aplikování..." : "Použít filtry"} <Funnel className="size-4" /></Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
