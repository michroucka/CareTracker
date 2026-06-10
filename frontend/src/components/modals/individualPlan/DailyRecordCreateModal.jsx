import React from "react";
import {
    Modal,
    Button,
    Form,
} from "@heroui/react";
import { Save } from "lucide-react";
import { getLocalTimeZone, now, CalendarDate, parseDate } from "@internationalized/date";
import { AppDatePicker } from "../../AppDatePicker.jsx";
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
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Modal.Container size="lg">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex flex-col gap-1">
                            <Modal.Heading>Přidat denní záznam</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            <Form
                                className="w-full space-y-4"
                                validationErrors={errors}
                                onReset={() => resetForm()}
                                onSubmit={handleSubmit}
                            >
                                <div className="flex flex-col gap-4 w-full">
                                    <AppDatePicker
                                        hideTimeZone
                                        isRequired
                                        isDisabled={isLoading}
                                        isInvalid={!!errors.date}
                                        errorMessage={errors.date}
                                        label="Datum"
                                        name="date"
                                        value={date ? parseDate(date) : null}
                                        onChange={(date) => {
                                            setDate(date ? date.toString() : "");
                                            if (errors.date) {
                                                setErrors({ ...errors, date: undefined });
                                            }
                                        }}
                                        minValue={new CalendarDate(MIN_YEAR, 1, 1)}
                                        maxValue={(() => {
                                            const zonedNow = now(getLocalTimeZone());
                                            return new CalendarDate(
                                                zonedNow.year,
                                                zonedNow.month,
                                                zonedNow.day
                                            );
                                        })()}
                                    />

                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-sm font-medium">Obsah záznamu <span className="text-danger">*</span></label>
                                        <textarea
                                            disabled={isLoading}
                                            name="content"
                                            value={content}
                                            onChange={(e) => {
                                                setContent(e.target.value);
                                                if (errors.content) {
                                                    setErrors({ ...errors, content: undefined });
                                                }
                                            }}
                                            rows={5}
                                            placeholder="Popište průběh dne, aktivity klienta, důležité události..."
                                            className={`w-full rounded-md border px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.content ? "border-danger" : "border-default"}`}
                                        />
                                        {errors.content && <span className="text-sm text-danger">{errors.content}</span>}
                                    </div>
                                </div>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer className="justify-between">
                            <Button
                                className="text-base"
                                type="reset"
                                variant="outline"
                                isDisabled={isLoading}
                                onPress={() => resetForm()}
                            >
                                Reset
                            </Button>
                            <Button variant="primary"
                                className="text-base"
                                isPending={isLoading}
                                isDisabled={isLoading}
                                onPress={handleSubmit}
                            >{isLoading ? "Ukládání..." : "Uložit záznam"} <Save className="size-4" /></Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
