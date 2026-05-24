import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Textarea,
    DatePicker,
    Form,
} from "@heroui/react";
import { Save, CalendarDays } from "lucide-react";
import { getLocalTimeZone, now, CalendarDate, parseDate } from "@internationalized/date";
import {MIN_YEAR} from "../../../constants/globalConstants.js";

export function DailyRecordCreateModal({ isOpen, onClose, onSubmit }) {
    const [date, setDate] = React.useState(() => {
        const zonedNow = now(getLocalTimeZone());
        return new CalendarDate(
            zonedNow.year,
            zonedNow.month,
            zonedNow.day
        ).toString();
    });
    const [content, setContent] = React.useState("");

    const [errors, setErrors] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(false);

    function validateForm() {
        const newErrors = {};

        if (!date) {
            newErrors.date = "Prosím zadejte datum";
        }

        if (!content || content.trim() === "") {
            newErrors.content = "Prosím zadejte obsah záznamu";
        }

        return newErrors;
    }

    async function handleSubmit(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        const newErrors = validateForm();

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsLoading(true);

        const dailyRecordData = {
            date,
            content: content.trim(),
        };

        try {
            if (onSubmit) {
                await onSubmit(dailyRecordData);
            }
            resetForm();
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsLoading(false);
        }
    }

    function resetForm() {
        const zonedNow = now(getLocalTimeZone());
        setDate(new CalendarDate(
            zonedNow.year,
            zonedNow.month,
            zonedNow.day
        ).toString());
        setContent("");
        setErrors({});
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            scrollBehavior="outside"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Přidat denní záznam</ModalHeader>
                <ModalBody>
                    <Form
                        className="w-full space-y-4"
                        validationErrors={errors}
                        onReset={() => resetForm()}
                        onSubmit={handleSubmit}
                    >
                        <div className="flex flex-col gap-4 w-full">
                            <DatePicker
                                hideTimeZone
                                isRequired
                                isDisabled={isLoading}
                                isInvalid={!!errors.date}
                                errorMessage={errors.date}
                                label="Datum"
                                labelPlacement="outside"
                                name="date"
                                value={date ? parseDate(date) : null}
                                onChange={(date) => {
                                    setDate(date ? date.toString() : "");
                                    if (errors.date) {
                                        setErrors({ ...errors, date: undefined });
                                    }
                                }}
                                showMonthAndYearPickers
                                selectorIcon={<CalendarDays size={18}/>}
                                minValue={new CalendarDate(MIN_YEAR, 1, 1)}
                                maxValue={(() => {
                                    const zonedNow = now(getLocalTimeZone());
                                    return new CalendarDate(
                                        zonedNow.year,
                                        zonedNow.month,
                                        zonedNow.day
                                    );
                                })()}
                                classNames={{
                                    segment: "text-default-500"
                                }}
                            />

                            <Textarea
                                isRequired
                                isDisabled={isLoading}
                                isInvalid={!!errors.content}
                                errorMessage={errors.content}
                                label="Obsah záznamu"
                                labelPlacement="outside"
                                name="content"
                                value={content}
                                onValueChange={(value) => {
                                    setContent(value);
                                    if (errors.content) {
                                        setErrors({ ...errors, content: undefined });
                                    }
                                }}
                                minRows={5}
                                placeholder="Popište průběh dne, aktivity klienta, důležité události..."
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
                        {isLoading ? "Ukládání..." : "Uložit záznam"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
