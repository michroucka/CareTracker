import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Select,
    SelectItem,
    Autocomplete,
    AutocompleteItem,
    Textarea,
    DatePicker,
    Form,
    NumberInput, Spinner, Tooltip,
} from "@heroui/react";
import {Save, CalendarDays, X, Pencil, ListFilter} from "lucide-react";
import { getLocalTimeZone, now, CalendarDateTime, parseDateTime } from "@internationalized/date";
import { unitTypeTranslations } from "../../../constants/performedTaskConstants.js";
import {ReadOnlyField} from "../../ReadOnlyField.jsx";

export function PerformedTaskDetailModal({ isOpen, onClose, onSubmit, isLoading, performedTask, clients = [], caregivers = [] , tasks = []}) {
    const [clientId, setClientId] = React.useState(null);
    const [taskId, setTaskId] = React.useState(null);
    const [date, setDate] = React.useState(null);
    const [unitCount, setUnitCount] = React.useState(null);
    const [notes, setNotes] = React.useState("");
    const [caregiverIds, setCaregiverIds] = React.useState([]);

    const [currentPerformedTaskData, setCurrentPerformedTaskData] = React.useState(null);

    const [errors, setErrors] = React.useState({});
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [showAllTasks, setShowAllTasks] = React.useState(false);

    // Najdi vybraného klienta
    const selectedClient = React.useMemo(() => {
        return clients.find(client => client.id === clientId);
    }, [clientId, clients]);

    // Filtruj úkony na základě vybraného klienta a showAllTasks checkboxu
    const filteredTasks = React.useMemo(() => {
        if (showAllTasks) {
            return tasks;
        }

        if (!selectedClient?.tasks) {
            return [];
        }

        // Filtruj pouze úkony, které má klient přiřazené
        const clientTaskIds = selectedClient.tasks.map(task => task.id);
        return tasks.filter(task => clientTaskIds.includes(task.id));
    }, [showAllTasks, selectedClient, tasks]);

    // Najdi vybraný task
    const selectedTask = React.useMemo(() => {
        return tasks.find(task => task.id === taskId);
    }, [taskId, tasks]);

    React.useEffect(() => {
        if (performedTask) {
            setCurrentPerformedTaskData(performedTask);
            initializeEditState(performedTask);
        }
    }, [performedTask]);

    React.useEffect(() => {
        if (!isOpen) {
            setIsEditMode(false);
        }
    }, [isOpen]);

    // Automaticky zapni showAllTasks pokud vybraný task není mezi klientovými tasky
    React.useEffect(() => {
        if (taskId && clientId && !showAllTasks) {
            const isTaskInClientTasks = filteredTasks.find(task => task.id === taskId);
            if (!isTaskInClientTasks) {
                setShowAllTasks(true);
            }
        }
    }, [taskId, clientId, filteredTasks, showAllTasks]);

    // Resetuj vybraný task, pokud není v seznamu dostupných tasků
    React.useEffect(() => {
        if (taskId && !filteredTasks.find(task => task.id === taskId)) {
            setTaskId(null);
        }
    }, [taskId, filteredTasks]);

    const initializeEditState = (performedTaskData) => {
        setClientId(performedTaskData.client?.id || null);
        setTaskId(performedTaskData.task?.id || null);
        setDate(performedTaskData.date || "");
        setUnitCount(performedTaskData.unitCount || null);
        setNotes(performedTaskData.notes || "");
        setCaregiverIds(performedTaskData.caregivers?.map(c => c.id) || []);
    }

    const handleEnterEditMode = () => {
        if (currentPerformedTaskData) {
            initializeEditState(currentPerformedTaskData);
            setIsEditMode(true);
        }
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setErrors({});
        if (currentPerformedTaskData) {
            initializeEditState(currentPerformedTaskData);
        }
    }

    // Získej jednotku vybraného tasku
    const unitLabel = React.useMemo(() => {
        if (!selectedTask?.unitType) return "";
        return unitTypeTranslations[selectedTask.unitType]?.toLowerCase() || "";
    }, [selectedTask]);

    // Zjisti, jestli jednotka podporuje desetinná čísla (KG, KM)
    const allowDecimals = React.useMemo(() => {
        return selectedTask?.unitType === "KG" || selectedTask?.unitType === "KM";
    }, [selectedTask]);

    function validateForm() {
        const newErrors = {};

        // Required pole
        if (!clientId) {
            newErrors.clientId = "Prosím vyberte klienta";
        }

        if (!taskId) {
            newErrors.taskId = "Prosím vyberte úkon";
        }

        if (!date) {
            newErrors.date = "Prosím zadejte datum";
        }

        if (!unitCount) {
            newErrors.unitCount = "Prosím zadejte počet jednotek"
        }

        if (caregiverIds.length <= 0) {
            newErrors.caregiverIds = "Prosím vyberte pečovatele";
        }

        return newErrors;
    }

    async function handleSubmit(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        // Validace před odesláním
        const newErrors = validateForm();

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Vše je validní, připrav data a zavolej původní onSubmit
        setErrors({});
        setIsSubmitting(true);

        const performedTaskData = {
            clientId,
            taskId,
            date,
            unitCount,
            notes: notes || null,
            caregiverIds: caregiverIds,
        };

        try {
            if (onSubmit && performedTask) {
                const updatedPerformedTask = await onSubmit(performedTask.id, performedTaskData);
                setCurrentPerformedTaskData(updatedPerformedTask);
                initializeEditState(updatedPerformedTask);
            }
            setIsEditMode(false);
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const isDisabled = !isEditMode || isSubmitting;

    return (
        <Modal isOpen={isOpen}
               onClose={onClose}
               size="lg"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Detail provedeného úkonu</ModalHeader>
                <ModalBody className="overflow-y-auto max-h-[50vh]">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Spinner size="lg" label="Načítání úkonu..." />
                        </div>
                    ) : performedTask ? (
                        <Form
                            className="w-full space-y-4"
                            validationErrors={errors}
                            onSubmit={handleSubmit}
                        >
                            <div className="flex flex-col gap-4 w-full">

                                {isEditMode ? (
                                    <Autocomplete
                                        isRequired
                                        isDisabled={isSubmitting}
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
                                                textValue={client.name}
                                            >
                                                {client.name}
                                            </AutocompleteItem>
                                        ))}
                                    </Autocomplete>
                                ) : (
                                    <ReadOnlyField
                                        label="Klient"
                                        value={clients.find(c => c.id === clientId)?.name || '-'}
                                    />
                                )}

                                {isEditMode ? (
                                    <div className="flex items-center">
                                        <Autocomplete
                                            isRequired
                                            isDisabled={isSubmitting}
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

                                        <Tooltip
                                            content="Zobrazit všechny úkony"
                                            placement="bottom"
                                        >
                                            <Button
                                                isIconOnly
                                                isDisabled={isSubmitting}
                                                onPress={() => {
                                                    const newShowAllTasks = !showAllTasks;
                                                    setShowAllTasks(newShowAllTasks);
                                                    // Pokud se přepíná na pouze klientovy tasky a task není mezi nimi, resetuj task
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
                                ) : (
                                    <ReadOnlyField
                                        label="Úkon"
                                        value={tasks.find(t => t.id === taskId)?.name || '-'}
                                    />
                                )}


                                <div className="grid grid-cols-2 gap-4">
                                    {isEditMode ? (
                                        <NumberInput
                                            isRequired
                                            isDisabled={isSubmitting}
                                            isInvalid={!!errors.taskId}
                                            errorMessage={errors.taskId}
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
                                    ) : (
                                        <ReadOnlyField
                                            label={unitLabel ? `Počet (${unitLabel})` : "Počet jednotek"}
                                            value={unitCount}
                                        />
                                    )}

                                    {isEditMode ? (
                                        <Select
                                            isRequired
                                            isDisabled={isSubmitting}
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
                                                    setErrors({...errors, caregiverIds: undefined});
                                                }
                                            }}
                                            classNames={{
                                                trigger: "min-h-12",
                                            }}
                                            renderValue={(items) => {
                                                const count = items.length;
                                                return `Celkem: ${count}`;
                                            }}
                                        >
                                            {caregivers.map((caregiver) => {
                                                const caregiverName = `${caregiver.firstName} ${caregiver.lastName}`;
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
                                    ) : (
                                        <ReadOnlyField
                                            label="Pečovatelé"
                                            value={caregiverIds.length > 0 ? `Celkem: ${caregiverIds.length}` : '-'}
                                        />
                                    )}
                                </div>

                                {isEditMode ? (
                                    <DatePicker
                                        hideTimeZone
                                        isDisabled={isSubmitting}
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
                                        selectorIcon={<CalendarDays size={18}/>}
                                        minValue={new CalendarDateTime(1900, 1, 1, 0, 0)}
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
                                ) : (
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
                                )}

                                {isEditMode ? (
                                    <Textarea
                                        isDisabled={isSubmitting}
                                        label="Poznámky"
                                        labelPlacement="inside"
                                        name="notes"
                                        value={notes}
                                        onValueChange={setNotes}
                                        minRows={2}
                                    />
                                ) : (
                                    <ReadOnlyField label="Poznámky" value={notes} />
                                )}
                            </div>
                        </Form>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Úkon nebyl nalezen
                        </div>
                    )}
                </ModalBody>
                <ModalFooter className="justify-between">
                    {isEditMode ? (
                        <>
                            <Button
                                variant="bordered"
                                startContent={<X size={16} />}
                                onPress={handleCancelEdit}
                                isDisabled={isSubmitting}
                            >
                                Zrušit
                            </Button>
                            <Button
                                color="primary"
                                startContent={<Save size={16} />}
                                onPress={handleSubmit}
                                isLoading={isSubmitting}
                                isDisabled={isSubmitting}
                            >
                                {isSubmitting ? "Ukládání..." : "Uložit změny"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="bordered" onPress={onClose}>
                                Zavřít
                            </Button>
                            <Button
                                color="primary"
                                startContent={<Pencil size={16} />}
                                onPress={handleEnterEditMode}
                            >
                                Upravit
                            </Button>
                        </>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
