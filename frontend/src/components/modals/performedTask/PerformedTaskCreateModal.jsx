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
    NumberInput,
} from "@heroui/react";
import { Save, CalendarDays } from "lucide-react";
import { getLocalTimeZone, now, CalendarDateTime, parseDateTime } from "@internationalized/date";
import { unitTypeTranslations } from "../../../constants/performedTaskConstants.js";

export function PerformedTaskCreateModal({ isOpen, onClose, onSubmit, clients = [], caregivers = [] , tasks = []}) {
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

                            <Select
                                isRequired
                                isDisabled={isLoading}
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
                                {tasks.map((task) => (
                                    <SelectItem
                                        key={task.id.toString()}
                                        value={task.id.toString()}
                                        textValue={task.name}
                                    >
                                        {task.name}
                                    </SelectItem>
                                ))}
                            </Select>


                            <div className="grid grid-cols-2 gap-4">
                                <NumberInput
                                    isRequired
                                    isDisabled={isLoading}
                                    isInvalid={!!errors.taskId}
                                    errorMessage={errors.taskId}
                                    label={unitLabel ? `Počet (${unitLabel})` : "Počet jednotek"}
                                    labelPlacement="inside"
                                    name="unitCount"
                                    type="number"
                                    value={unitCount}
                                    onValueChange={setUnitCount}
                                    minValue={allowDecimals ? 0.1 : 1}
                                    step={allowDecimals ? 0.1 : 1}
                                    formatOptions={allowDecimals ? {
                                        minimumFractionDigits: 1,
                                        maximumFractionDigits: 1
                                    } : {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }}
                                    isWheelDisabled
                                />

                                <Select
                                    isRequired
                                    isDisabled={isLoading}
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
                            </div>

                            <DatePicker
                                hideTimeZone
                                isDisabled={isLoading}
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
                                isDisabled={isLoading}
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
                        isDisabled={isLoading}
                        onPress={() => resetForm()}
                    >
                        Reset
                    </Button>
                    <Button
                        className="text-base"
                        color="primary"
                        isLoading={isLoading}
                        isDisabled={isLoading}
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
