import React from "react";
import { DatePicker } from "@/components/DatePicker";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { terminationReasonOptions } from "@/constants/clientConstants";
import { useRecordForm } from "@/hooks/useRecordForm";
import { todayIsoDate } from "@/lib/dates";

function validate(values) {
    const errors = {};
    if (!values.terminationDate) errors.terminationDate = "Prosím zadejte datum ukončení";
    else if (values.terminationDate > todayIsoDate()) errors.terminationDate = "Datum ukončení nemůže být v budoucnosti";
    if (!values.terminationReason) errors.terminationReason = "Prosím vyberte důvod";
    return errors;
}

/**
 * Ends the client's contract: date (not in the future) and reason. The client becomes inactive.
 */
export function ClientTerminateDialog({ open, onOpenChange, client, onTerminate }) {
    const form = useRecordForm({ terminationDate: todayIsoDate(), terminationReason: "" });
    const { reset } = form;

    React.useEffect(() => {
        if (open) reset({ terminationDate: todayIsoDate(), terminationReason: "" });
    }, [open, reset]);

    const submit = async (event) => {
        event.preventDefault();
        const done = await form.submit(validate, (values) => onTerminate(client.id, values));
        if (done) onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(next) => !form.isSubmitting && onOpenChange(next)}>
            <DialogContent>
                <form noValidate onSubmit={submit} className="grid gap-6">
                    <DialogHeader>
                        <DialogTitle>Ukončit smlouvu</DialogTitle>
                        <DialogDescription>
                            {client?.fullName} přestane být aktivním klientem a nepůjde mu zapisovat péči. Údaje i záznamy zůstanou zachované.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 items-start gap-3">
                        <FormField id="terminate-date" label="Datum ukončení" required error={form.errors.terminationDate} shakeSignal={form.submitCount}>
                            {(controlProps) => (
                                <DatePicker {...controlProps} maxDate={todayIsoDate()} disabled={form.isSubmitting} value={form.values.terminationDate}
                                    onChange={(date) => form.setField("terminationDate", date)} />
                            )}
                        </FormField>
                        <FormField id="terminate-reason" label="Důvod" required error={form.errors.terminationReason} shakeSignal={form.submitCount}>
                            {(controlProps) => (
                                <Select value={form.values.terminationReason} onValueChange={(reason) => form.setField("terminationReason", reason)} disabled={form.isSubmitting}>
                                    <SelectTrigger {...controlProps} className="w-full"><SelectValue placeholder="Vyberte důvod" /></SelectTrigger>
                                    <SelectContent>
                                        {terminationReasonOptions.map((reason) => <SelectItem key={reason.key} value={reason.key}>{reason.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        </FormField>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.isSubmitting}>Zrušit</Button>
                        <Button type="submit" variant="destructive" disabled={form.isSubmitting}>{form.isSubmitting ? "Ukončuji…" : "Ukončit smlouvu"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
