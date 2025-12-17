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
    Textarea,
    DatePicker,
    Form,
    NumberInput, Tooltip,
} from "@heroui/react";
import { Save, CalendarDays, ListFilter } from "lucide-react";
import { getLocalTimeZone, now, CalendarDateTime, parseDateTime } from "@internationalized/date";
import { unitTypeTranslations } from "../../../constants/performedTaskConstants.js";
import { useAuth } from "../../../contexts/AuthContext.tsx";

export function PerformedTaskCreateModal({ isOpen, onClose, onSubmit, clients = [], caregivers = [] , tasks = []}) {
    const { user } = useAuth();
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

    const [errors, setErrors] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(false);
    const [showAllTasks, setShowAllTasks] = React.useState(false);
    const [isDisabled, setIsDisabled] = React.useState(true);

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

    // Získej jednotku vybraného tasku
    const unitLabel = React.useMemo(() => {
        if (!selectedTask?.unitType) return "";
        return unitTypeTranslations[selectedTask.unitType]?.toLowerCase() || "";
    }, [selectedTask]);

    // Zjisti, jestli jednotka podporuje desetinná čísla (KG, KM)
    const allowDecimals = React.useMemo(() => {
        return selectedTask?.unitType === "KG" || selectedTask?.unitType === "KM";
    }, [selectedTask]);

    // Resetuj vybraný task, pokud není v seznamu dostupných tasků
    React.useEffect(() => {
        if (taskId && !filteredTasks.find(task => task.id === taskId)) {
            setTaskId(null);
        }
    }, [taskId, filteredTasks]);

    React.useEffect(() => {
        if (selectedClient) {
            setIsDisabled(false);
        } else {
            setIsDisabled(true);
        }
    }, [selectedClient]);

    // Nastavení defaultního caregivera na aktuálního uživatele
    React.useEffect(() => {
        if (user?.employeeId && caregivers.length > 0 && caregiverIds.length === 0) {
            // Zkontroluj, jestli uživatel je v seznamu caregivers
            const userIsCaregiver = caregivers.find(cg => cg.id === user.employeeId);
            if (userIsCaregiver) {
                setCaregiverIds([user.employeeId]);
            }
        }
    }, [user, caregivers, caregiverIds.length]);

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
        setIsLoading(true);

        const performedTaskData = {
            clientId,
            taskId,
            date,
            unitCount,
            notes: notes || null,
            caregiverIds: caregiverIds,
        };

        try {
            if (onSubmit) {
                await onSubmit(performedTaskData);
            }
            // Pokud úspěch, reset formuláře
            resetForm();
        } catch (error) {
            // Pokud error, formulář zůstane vyplněný
            console.error("Error submitting form:", error);
        } finally {
            setIsLoading(false);
        }
    }

    function resetForm() {
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
        setErrors({});
    }

    return (
        <Modal isOpen={isOpen}
               onClose={onClose}
               size="lg"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Zadat nový provedený úkon</ModalHeader>
                <ModalBody className="overflow-y-auto max-h-[50vh]">
                    <Form
                        className="w-full space-y-4"
                        validationErrors={errors}
                        onReset={() => resetForm()}
                        onSubmit={handleSubmit}
                    >
                        <div className="flex flex-col gap-4 w-full">

                            <Select
                                isRequired
                                isDisabled={isLoading}
                                isInvalid={!!errors.clientId}
                                errorMessage={errors.clientId}
                                label="Klient"
                                labelPlacement="inside"
                                name="clientId"
                                selectedKeys={clientId ? [clientId.toString()] : []}
                                onSelectionChange={(keys) => {
                                    const selectedId = Array.from(keys)[0];
                                    setClientId(selectedId ? parseInt(selectedId) : null);
                                    if (errors.clientId) {
                                        setErrors({ ...errors, clientId: undefined });
                                    }
                                }}
                            >
                                {clients.map((client) => (
                                    <SelectItem
                                        key={client.id.toString()}
                                        value={client.id.toString()}
                                        textValue={client.name}
                                    >
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </Select>

                            <div className="flex items-center">
                                <Select
                                    isRequired
                                    isDisabled={isDisabled}
                                    isInvalid={!!errors.taskId}
                                    errorMessage={errors.taskId}
                                    label="Úkon"
                                    labelPlacement="inside"
                                    name="taskId"
                                    selectedKeys={taskId ? [taskId.toString()] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedId = Array.from(keys)[0];
                                        setTaskId(selectedId ? parseInt(selectedId) : null);
                                        if (errors.taskId) {
                                            setErrors({ ...errors, taskId: undefined });
                                        }
                                    }}
                                >
                                    {filteredTasks.map((task) => (
                                        <SelectItem
                                            key={task.id.toString()}
                                            value={task.id.toString()}
                                            textValue={task.name}
                                        >
                                            {task.name}
                                        </SelectItem>
                                    ))}
                                </Select>

                                <Tooltip
                                    content="Zobrazit všechny úkony"
                                    placement="bottom"
                                >
                                    <Button
                                        isIconOnly
                                        isDisabled={isDisabled}
                                        onPress={()=> setShowAllTasks(!showAllTasks)}
                                        variant="light"
                                        color={showAllTasks ? 'primary' : 'default'}
                                        children={<ListFilter size={20} />}
                                        className="m-2"

                                    />
                                </Tooltip>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <NumberInput
                                    isRequired
                                    isDisabled={isDisabled}
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
                                        minimumFractionDigits: 1,
                                        maximumFractionDigits: 2
                                    } : {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }}
                                    isWheelDisabled
                                />

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
                                    }}
                                    classNames={{
                                        trigger: "min-h-12",
                                    }}
                                    renderValue={(items) => {
                                        const count = items.length;
                                        return count > 1 ? `Celkem: ${count}` : items[0].textValue;
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
                            </div>

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

                            <Textarea
                                isDisabled={isDisabled}
                                label="Poznámky"
                                labelPlacement="inside"
                                name="notes"
                                value={notes}
                                onValueChange={setNotes}
                                minRows={2}
                            />
                        </div>
                    </Form>
                </ModalBody>
                <ModalFooter className="justify-between">
                    <Button
                        className="text-base"
                        type="reset"
                        variant="bordered"
                        isDisabled={isDisabled}
                        onPress={() => resetForm()}
                    >
                        Reset
                    </Button>
                    <Button
                        className="text-base"
                        color="primary"
                        isLoading={isLoading}
                        isDisabled={isDisabled}
                        endContent={<Save className="size-4" />}
                        onPress={handleSubmit}
                    >
                        {isLoading ? "Ukládání..." : "Uložit úkon"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
