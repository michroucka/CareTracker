import React from "react";
import { DatePicker } from "@/components/DatePicker";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useRecordForm } from "@/hooks/useRecordForm";
import { todayIsoDate } from "@/lib/dates";

const emptyRecord = () => ({ date: todayIsoDate(), content: "" });

function validate(values) {
    const errors = {};
    if (!values.date) errors.date = "Prosím zadejte datum";
    else if (values.date > todayIsoDate()) errors.date = "Datum nemůže být v budoucnosti";
    if (!values.content.trim()) errors.content = "Prosím popište průběh dne";
    return errors;
}

/** New daily record of the individual plan: date (not in the future) and free text. */
export function DailyRecordDialog({ open, onOpenChange, onCreate }) {
    const form = useRecordForm(emptyRecord());
    const { reset } = form;

    React.useEffect(() => {
        if (open) reset(emptyRecord());
    }, [open, reset]);

    const submit = async (event) => {
        event.preventDefault();
        const done = await form.submit(validate, (values) => onCreate({ date: values.date, content: values.content.trim() }));
        if (done) onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(next) => !form.isSubmitting && onOpenChange(next)}>
            <DialogContent className="sm:max-w-lg">
                <form noValidate onSubmit={submit} className="grid gap-6">
                    <DialogHeader>
                        <DialogTitle>Nový denní záznam</DialogTitle>
                        <DialogDescription>Jak den proběhl, co klient dělal a co je důležité předat dál.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <FormField id="daily-record-date" label="Datum" required error={form.errors.date} shakeSignal={form.submitCount} className="sm:max-w-56">
                            {(controlProps) => (
                                <DatePicker {...controlProps} maxDate={todayIsoDate()} disabled={form.isSubmitting} value={form.values.date} onChange={(date) => form.setField("date", date)} />
                            )}
                        </FormField>
                        <FormField id="daily-record-content" label="Záznam" required error={form.errors.content} shakeSignal={form.submitCount}>
                            {(controlProps) => (
                                <Textarea {...controlProps} autoFocus rows={6} className="min-h-32" disabled={form.isSubmitting} value={form.values.content}
                                    onChange={(event) => form.setField("content", event.target.value)} />
                            )}
                        </FormField>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.isSubmitting}>Zrušit</Button>
                        <Button type="submit" disabled={form.isSubmitting}>{form.isSubmitting ? "Ukládám…" : "Uložit záznam"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
