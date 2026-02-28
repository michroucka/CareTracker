import React from "react";
import { terminationReasonOptions } from "../../../constants/clientConstants.js";
import {
    DatePicker,
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    Form,
    Select,
    SelectItem, Button, ModalFooter
} from "@heroui/react";
import {CalendarDate, getLocalTimeZone, parseDate, today} from "@internationalized/date";
import {CalendarDays, UserRoundX} from "lucide-react";
import {minYear} from "../../../constants/globalConstants.js";

export function ClientTerminateModal({ isOpen, onClose, onSubmit, clientId, clientName }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const [terminationDate, setTerminationDate] = React.useState(today(getLocalTimeZone()).toString());
    const [terminationReason, setTerminationReason] = React.useState(null);

    const [errors, setErrors] = React.useState({});

    React.useEffect(() => {
        if (!isOpen) {
            setTerminationDate(today(getLocalTimeZone()).toString());
            setTerminationReason(null);
            setErrors({});
        }
    }, [isOpen]);

    function validateForm() {
        const newErrors = {};

        if (!terminationDate) newErrors.terminationDate = "Prosím zadejte datum ukončení smlouvy";
        if (!terminationReason) newErrors.terminationReason = "Prosím zadejte důvod ukončení smlouvy";

        return newErrors;
    }

    async function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();

        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        const data = {
            terminationDate,
            terminationReason,
        };

        try {
            if (onSubmit && clientId) {
                await onSubmit(clientId, data);
            }
            onClose();
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal isOpen={isOpen}
               onClose={onClose}
               size="lg"
               scrollBehavior="outside"
        >
            <ModalContent>
                <ModalHeader className="flex justify-between items-center">
                    Deaktivovat klienta {clientName}
                </ModalHeader>
                <ModalBody>
                    <Form
                        className="w-full space-y-4"
                        validationErrors={errors}
                        onSubmit={handleSubmit}
                    >
                        <div className="flex flex-col gap-4 w-full">
                            <DatePicker
                                isDisabled={isSubmitting}
                                isInvalid={!!errors.terminationDate}
                                errorMessage={errors.terminationDate}
                                label="Datum ukončení smlouvy"
                                labelPlacement="inside"
                                name="terminationDate"
                                value={terminationDate ? parseDate(terminationDate) : null}
                                onChange={(date) => {
                                    setTerminationDate(date ? date.toString() : "");
                                    if (errors.terminationDate) {
                                        setErrors({ ...errors, terminationDate: undefined});
                                    }
                                }}
                                showMonthAndYearPickers
                                selectorIcon={<CalendarDays size={18} />}
                                minValue={new CalendarDate(minYear, 1, 1)}
                                maxValue={today(getLocalTimeZone())}
                                isRequired
                                classNames={{
                                    segment: "text-default-500"
                                }}
                            />

                            <Select
                                isDisabled={isSubmitting}
                                isInvalid={!!errors.terminationReason}
                                errorMessage={errors.terminationReason}
                                label="Důvod ukončení smlouvy"
                                labelPlacement="inside"
                                name="terminationReason"
                                selectedKeys={terminationReason ? [terminationReason] : []}
                                onSelectionChange={(keys) => {
                                    setTerminationReason(Array.from(keys)[0]);
                                    if (errors.terminationReason) {
                                        setErrors({ ...errors, terminationReason: undefined });
                                    }
                                }}
                                isRequired
                            >
                                {terminationReasonOptions.map((reason) => (
                                    <SelectItem key={reason.key} value={reason.key}>
                                        {reason.name}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>
                    </Form>
                </ModalBody>
                <ModalFooter className="justify-between">
                    <Button variant="bordered" onPress={onClose}>
                        Zavřít
                    </Button>
                    <Button
                        className="text-base"
                        color="danger"
                        isLoading={isSubmitting}
                        isDisabled={isSubmitting}
                        endContent={<UserRoundX className="size-4" />}
                        onPress={handleSubmit}
                    >
                        {isSubmitting ? "Ukládání..." : "Deaktivovat klienta"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}