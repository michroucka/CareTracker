import {
    Select,
    SelectItem,
    Textarea,
    DatePicker,
    Form,
    NumberInput,
    Tooltip,
    Autocomplete,
    AutocompleteItem,
    Button,
} from "@heroui/react";
import { CalendarDays, ListFilter } from "lucide-react";
import React from "react";
import { getLocalTimeZone, now, CalendarDateTime, parseDateTime } from "@internationalized/date";
import {calculatePrice, unitTypeTranslations} from "../../constants/performedTaskConstants.js";
import { ReadOnlyField } from "../ReadOnlyField.jsx";
import {MIN_YEAR} from "../../constants/globalConstants.js";

/**
 * Reusable performed task form component used in both create and edit modals
 *
 * @param {Object} props
 * @param {Object} props.initialData - Initial form data (for edit mode)
 * @param {Function} props.onSubmit - Submit handler that receives validated form data
 * @param {boolean} props.isLoading - Loading state for form submission
 * @param {boolean} props.isReadOnly - Whether form is in read-only mode
 * @param {Array} props.clients - List of clients
 * @param {Array} props.caregivers - List of caregivers
 * @param {Array} props.tasks - List of tasks
 * @param {number} props.userEmployeeId - Current user's employee ID (for default caregiver)
 * @param {React.Ref} props.formRef - Ref for imperative form controls (reset, etc.)
 */
export const PerformedTaskForm = React.forwardRef(({
    initialData = null,
    onSubmit,
    isLoading = false,
    isReadOnly = false,
    clients = [],
    caregivers = [],
    tasks = [],
    userEmployeeId = null,
}, formRef) => {
    const [clientId, setClientId] = React.useState(null);
    const [taskId, setTaskId] = React.useState(null);
    const [date, setDate] = React.useState(() => {
        const zonedNow = now(getLocalTimeZone());
        return new CalendarDateTime(
            zonedNow.year,
            zonedNow.month,
            zonedNow.day,
            zonedNow.hour,
            zonedNow.minute,
            0
        ).toString();
    });
    const [unitCount, setUnitCount] = React.useState(null);
    const [notes, setNotes] = React.useState("");
    const [caregiverIds, setCaregiverIds] = React.useState([]);
    const [showAllTasks, setShowAllTasks] = React.useState(false);
    const [errors, setErrors] = React.useState({});

    // Initialize form with initial data
    React.useEffect(() => {
        if (initialData) {
            setClientId(initialData.client?.id || initialData.clientId || null);
            setTaskId(initialData.task?.id || initialData.taskId || null);
            setDate(initialData.date || "");
            setUnitCount(initialData.unitCount || null);
            setNotes(initialData.notes || "");
            setCaregiverIds(initialData.caregivers?.map(c => c.id) || initialData.caregiverIds || []);
        }
    }, [initialData]);

    // Set default caregiver for create mode
    React.useEffect(() => {
        if (userEmployeeId && caregivers.length > 0 && caregiverIds.length === 0 && !initialData) {
            const userIsCaregiver = caregivers.find(cg => cg.id === userEmployeeId);
            if (userIsCaregiver) {
                setCaregiverIds([userEmployeeId]);
            }
        }
    }, [userEmployeeId, caregivers, caregiverIds.length, initialData]);

    // Find selected client
    const selectedClient = React.useMemo(() => {
        return clients.find(client => client.id === clientId);
    }, [clientId, clients]);

    // Filter tasks based on selected client and showAllTasks toggle
    const filteredTasks = React.useMemo(() => {
        if (showAllTasks) {
            return tasks;
        }

        if (!selectedClient?.tasks) {
            return [];
        }

        const clientTaskIds = selectedClient.tasks.map(task => task.id);
        return tasks.filter(task => clientTaskIds.includes(task.id));
    }, [showAllTasks, selectedClient, tasks]);

    // Find selected task
    const selectedTask = React.useMemo(() => {
        return tasks.find(task => task.id === taskId);
    }, [taskId, tasks]);

    // Get unit label for selected task
    const unitLabel = React.useMemo(() => {
        if (!selectedTask?.unitType) return "";
        return unitTypeTranslations[selectedTask.unitType] || "";
    }, [selectedTask]);

    // Check if unit supports decimals (KG, KM)
    const allowDecimals = React.useMemo(() => {
        return selectedTask?.unitType === "KG" || selectedTask?.unitType === "KM";
    }, [selectedTask]);

    // Check if form fields should be disabled (no client selected in create mode)
    const isDisabled = React.useMemo(() => {
        return !isReadOnly && !selectedClient;
    }, [isReadOnly, selectedClient]);

    // Auto-enable showAllTasks if selected task is not in client's tasks (for edit mode)
    React.useEffect(() => {
        if (taskId && clientId && !showAllTasks && initialData) {
            const isTaskInClientTasks = filteredTasks.find(task => task.id === taskId);
            if (!isTaskInClientTasks) {
                setShowAllTasks(true);
            }
        }
    }, [taskId, clientId, filteredTasks, showAllTasks, initialData]);

    // Reset selected task if not in filtered tasks (only when user manually changes filter, not during initialization)
    React.useEffect(() => {
        // Don't reset if we're in edit mode and still initializing (showAllTasks might not be set yet)
        if (initialData && !showAllTasks) {
            return;
        }

        if (taskId && !filteredTasks.find(task => task.id === taskId)) {
            setTaskId(null);
        }
    }, [taskId, filteredTasks, initialData, showAllTasks]);

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!clientId) newErrors.clientId = "Prosím vyberte klienta";
        if (!taskId) newErrors.taskId = "Prosím vyberte úkon";
        if (!date) newErrors.date = "Prosím zadejte datum";
        if (!unitCount) newErrors.unitCount = "Prosím zadejte počet jednotek";
        if (caregiverIds.length <= 0) newErrors.caregiverIds = "Prosím vyberte pečovatele";

        return newErrors;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        const formData = {
            clientId,
            taskId,
            date,
            unitCount,
            notes: notes || null,
            caregiverIds,
        };

        if (onSubmit) {
            await onSubmit(formData);
        }
    };

    // Reset form
    const resetForm = () => {
        setClientId(null);
        setTaskId(null);
        const zonedNow = now(getLocalTimeZone());
        setDate(new CalendarDateTime(
            zonedNow.year,
            zonedNow.month,
            zonedNow.day,
            zonedNow.hour,
            zonedNow.minute,
            0
        ).toString());
        setUnitCount(null);
        setNotes("");
        setCaregiverIds([]);
        setShowAllTasks(false);
        setErrors({});
    };

    // Expose imperative methods via ref
    React.useImperativeHandle(formRef, () => ({
        submit: handleSubmit,
        reset: resetForm,
    }));

    return (
        <Form
            className="w-full space-y-4"
            validationErrors={errors}
            onReset={resetForm}
            onSubmit={handleSubmit}
        >
            <div className="flex flex-col gap-4 w-full">
                {/* Client Selection */}
                {isReadOnly ? (
                    <ReadOnlyField
                        label="Klient"
                        value={initialData?.client?.fullName || '-'}
                    />
                ) : (
                    <Autocomplete
                        isRequired
                        isDisabled={isLoading}
                        isInvalid={!!errors.clientId}
                        errorMessage={errors.clientId}
                        label="Klient"
                        labelPlacement="inside"
                        name="clientId"
                        selectedKey={clientId ? clientId.toString() : null}
                        onSelectionChange={(key) => {
                            setClientId(key ? parseInt(key) : null);
                            if (errors.clientId) {
                                setErrors({ ...errors, clientId: undefined });
                            }
                        }}
                    >
                        {clients.map((client) => (
                            <AutocompleteItem
                                key={client.id.toString()}
                                value={client.id.toString()}
                                textValue={client.fullName}
                            >
                                {client.fullName}
                            </AutocompleteItem>
                        ))}
                    </Autocomplete>
                )}

                {/* Task Selection with Filter Toggle */}
                {isReadOnly ? (
                    <ReadOnlyField
                        label="Úkon"
                        value={initialData?.task?.name || '-'}
                    />
                ) : (
                    <div className="flex items-center">
                        <Autocomplete
                            isRequired
                            isDisabled={isDisabled}
                            isInvalid={!!errors.taskId}
                            errorMessage={errors.taskId}
                            label="Úkon"
                            labelPlacement="inside"
                            name="taskId"
                            selectedKey={taskId ? taskId.toString() : null}
                            onSelectionChange={(key) => {
                                setTaskId(key ? parseInt(key) : null);
                                if (errors.taskId) {
                                    setErrors({ ...errors, taskId: undefined });
                                }
                            }}
                        >
                            {filteredTasks.map((task) => (
                                <AutocompleteItem
                                    key={task.id.toString()}
                                    value={task.id.toString()}
                                    textValue={task.name}
                                >
                                    {task.name}
                                </AutocompleteItem>
                            ))}
                        </Autocomplete>

                        <Tooltip content="Zobrazit všechny úkony" placement="bottom">
                            <Button
                                isIconOnly
                                isDisabled={isDisabled}
                                onPress={() => {
                                    const newShowAllTasks = !showAllTasks;
                                    setShowAllTasks(newShowAllTasks);
                                    // If switching to client tasks only and task is not in them, reset task
                                    if (!newShowAllTasks && taskId && selectedClient?.tasks) {
                                        const clientTaskIds = selectedClient.tasks.map(t => t.id);
                                        if (!clientTaskIds.includes(taskId)) {
                                            setTaskId(null);
                                        }
                                    }
                                }}
                                variant="light"
                                color={showAllTasks ? 'primary' : 'default'}
                                children={<ListFilter size={20} />}
                                className="m-2"
                            />
                        </Tooltip>
                    </div>
                )}

                {/* Unit Count and Caregivers */}
                <div className="grid grid-cols-2 gap-4">
                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Počet"
                            value={unitCount}
                            type="number"
                            endContent={unitTypeTranslations[initialData?.task?.unitType] || ''}
                        />
                    ) : (
                        <NumberInput
                            isRequired
                            isDisabled={isDisabled}
                            isInvalid={!!errors.unitCount}
                            errorMessage={errors.unitCount}
                            label={unitLabel ? `Počet (${unitLabel})` : "Počet jednotek"}
                            labelPlacement="inside"
                            name="unitCount"
                            type="number"
                            value={unitCount}
                            onValueChange={setUnitCount}
                            minValue={allowDecimals ? 0.01 : 1}
                            step={allowDecimals ? 0.01 : 1}
                            formatOptions={allowDecimals ? {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2
                            } : {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }}
                            isWheelDisabled
                        />
                    )}

                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Pečovatelé"
                            value={initialData?.caregivers?.length > 1 ? `Celkem: ${initialData.caregivers.length}` : initialData?.caregivers?.[0]?.fullName || '-'}
                        />
                    ) : (
                        <Select
                            isRequired
                            isDisabled={isDisabled}
                            isInvalid={!!errors.caregiverIds}
                            errorMessage={errors.caregiverIds}
                            label="Pečovatelé"
                            labelPlacement="inside"
                            name="caregiverIds"
                            selectionMode="multiple"
                            selectedKeys={caregiverIds.map(id => id.toString())}
                            onSelectionChange={(keys) => {
                                const selectedIds = Array.from(keys).map(key => parseInt(key));
                                setCaregiverIds(selectedIds);
                                if (errors.caregiverIds) {
                                    setErrors({ ...errors, caregiverIds: undefined });
                                }
                            }}
                            classNames={{
                                trigger: "min-h-12",
                            }}
                            renderValue={(items) => {
                                const count = items.length;
                                return count > 1 ? `Celkem: ${count}` : items[0]?.textValue;
                            }}
                        >
                            {caregivers.map((caregiver) => {
                                const caregiverName = caregiver.fullName;
                                return (
                                    <SelectItem
                                        key={caregiver.id.toString()}
                                        value={caregiver.id.toString()}
                                        textValue={caregiverName}
                                    >
                                        {caregiverName}
                                    </SelectItem>
                                );
                            })}
                        </Select>
                    )}
                </div>

                {/* Date Picker and Price*/}
                <div className="grid grid-cols-2 gap-4">
                    {isReadOnly ? (
                        <ReadOnlyField
                            label="Datum"
                            value={date ? new Date(date).toLocaleString('cs-CZ', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : '-'}
                        />
                    ) : (
                        <DatePicker
                            hideTimeZone
                            isDisabled={isDisabled}
                            isInvalid={!!errors.date}
                            errorMessage={errors.date}
                            label="Datum"
                            labelPlacement="inside"
                            name="date"
                            value={date ? parseDateTime(date) : null}
                            onChange={(date) => {
                                setDate(date ? date.toString() : "");
                                if (errors.date) {
                                    setErrors({ ...errors, date: undefined });
                                }
                            }}
                            showMonthAndYearPickers
                            selectorIcon={<CalendarDays size={18} />}
                            minValue={new CalendarDateTime(MIN_YEAR, 1, 1, 0, 0)}
                            maxValue={(() => {
                                const zonedNow = now(getLocalTimeZone());
                                return new CalendarDateTime(
                                    zonedNow.year,
                                    zonedNow.month,
                                    zonedNow.day,
                                    zonedNow.hour,
                                    zonedNow.minute,
                                    0
                                );
                            })()}
                            isRequired
                            classNames={{
                                segment: "text-default-500"
                            }}
                        />
                    )}


                    <ReadOnlyField
                        label="Cena"
                        value={calculatePrice(isReadOnly ? initialData?.task : tasks.find(t => t.id === taskId), unitCount)}
                        type="number"
                        endContent="Kč"
                        isDisabled={isDisabled}
                    />
                </div>

                {/* Notes */}
                {isReadOnly ? (
                    <ReadOnlyField label="Poznámky" value={notes} />
                ) : (
                    <Textarea
                        isDisabled={isDisabled}
                        label="Poznámky"
                        labelPlacement="inside"
                        name="notes"
                        value={notes}
                        onValueChange={setNotes}
                        minRows={2}
                    />
                )}
            </div>
        </Form>
    );
});
PerformedTaskForm.displayName = "PerformedTaskForm";
