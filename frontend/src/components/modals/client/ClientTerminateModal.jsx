import React from "react";
import { terminationReasonOptions } from "../../../constants/clientConstants.js";
import {
    Modal,
    Form,
    Select,
    Label,
    ListBox,
    FieldError,
    Button,
} from "@heroui/react";
import {CalendarDate, getLocalTimeZone, parseDate, today} from "@internationalized/date";
import {UserRoundX} from "lucide-react";
import {MIN_YEAR} from "../../../constants/globalConstants.js";
import {AppDatePicker} from "../../AppDatePicker.jsx";

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
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Modal.Container size="lg">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex justify-between items-center">
                            <Modal.Heading>Deaktivovat klienta {clientName}</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            <Form
                                className="w-full space-y-4"
                                validationErrors={errors}
                                onSubmit={handleSubmit}
                            >
                                <div className="flex flex-col gap-4 w-full">
                                    <AppDatePicker
                                        isDisabled={isSubmitting}
                                        isInvalid={!!errors.terminationDate}
                                        errorMessage={errors.terminationDate}
                                        label="Datum ukončení smlouvy"
                                        name="terminationDate"
                                        value={terminationDate ? parseDate(terminationDate) : null}
                                        onChange={(date) => {
                                            setTerminationDate(date ? date.toString() : "");
                                            if (errors.terminationDate) {
                                                setErrors({ ...errors, terminationDate: undefined});
                                            }
                                        }}
                                        minValue={new CalendarDate(MIN_YEAR, 1, 1)}
                                        maxValue={today(getLocalTimeZone())}
                                        isRequired
                                    />

                                    <Select
                                        isDisabled={isSubmitting}
                                        isInvalid={!!errors.terminationReason}
                                        name="terminationReason"
                                        value={terminationReason}
                                        onChange={(value) => {
                                            setTerminationReason(value);
                                            if (errors.terminationReason) {
                                                setErrors({ ...errors, terminationReason: undefined });
                                            }
                                        }}
                                        isRequired
                                    >
                                        <Label>Důvod ukončení smlouvy</Label>
                                        <Select.Trigger>
                                            <Select.Value />
                                            <Select.Indicator />
                                        </Select.Trigger>
                                        <Select.Popover>
                                            <ListBox>
                                                {terminationReasonOptions.map((reason) => (
                                                    <ListBox.Item key={reason.key} id={reason.key} textValue={reason.name}>
                                                        {reason.name}
                                                        <ListBox.ItemIndicator />
                                                    </ListBox.Item>
                                                ))}
                                            </ListBox>
                                        </Select.Popover>
                                        <FieldError>{errors.terminationReason}</FieldError>
                                    </Select>
                                </div>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer className="justify-between">
                            <Button variant="outline" onPress={onClose}>
                                Zavřít
                            </Button>
                            <Button variant="danger"
                                className="text-base"
                                isPending={isSubmitting}
                                isDisabled={isSubmitting}
                                onPress={handleSubmit}
                            >{isSubmitting ? "Ukládání..." : "Deaktivovat klienta"} <UserRoundX className="size-4" /></Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}