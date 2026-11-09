import React from "react";
import { RecordSheet } from "@/components/data/RecordSheet";
import { Button } from "@/components/ui/button";
import { useRecordForm } from "@/hooks/useRecordForm";
import { useAuth } from "@/contexts/AuthContext";
import { PerformedTaskFields } from "./PerformedTaskFields";
import { emptyPerformedTask, requiredCaregiverId, toPersonOptions, toRequest, validatePerformedTask } from "./performedTaskForm";

/**
 * New performed task in a sheet, so the list stays visible next to it. `defaultCaregiverId` pre-selects
 * the signed-in caregiver.
 */
export function PerformedTaskCreateSheet({ open, onOpenChange, onCreate, clients, tasks, caregivers, defaultCaregiverId }) {
    const { user } = useAuth();
    const caregiverId = caregivers.some((caregiver) => caregiver.id === defaultCaregiverId) ? defaultCaregiverId : null;
    const form = useRecordForm(emptyPerformedTask(caregiverId));
    const { reset } = form;

    React.useEffect(() => {
        if (open) reset(emptyPerformedTask(caregiverId));
    }, [open, reset, caregiverId]);

    const create = async (event) => {
        event.preventDefault();
        const validate = (values) => validatePerformedTask(values, tasks.find((task) => task.id === values.taskId), requiredCaregiverId(user));
        const created = await form.submit(validate, (values) => onCreate(toRequest(values)));
        if (created) onOpenChange(false);
    };

    const footer = (
        <>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={form.isSubmitting}>Zrušit</Button>
            <Button type="submit" form="performed-task-create-form" disabled={form.isSubmitting}>{form.isSubmitting ? "Ukládám…" : "Zapsat úkon"}</Button>
        </>
    );

    return (
        <RecordSheet
            open={open}
            onOpenChange={(next) => !form.isSubmitting && onOpenChange(next)}
            badge="Nový záznam"
            title="Zapsat úkon"
            description="Zápis provedeného úkonu u klienta"
            footer={footer}
            contentKey="create"
        >
            <form id="performed-task-create-form" noValidate onSubmit={create}>
                <PerformedTaskFields
                    idPrefix="performed-task-create"
                    values={form.values}
                    errors={form.errors}
                    onChange={form.setField}
                    disabled={form.isSubmitting}
                    shakeSignal={form.submitCount}
                    clients={clients}
                    tasks={tasks}
                    caregivers={toPersonOptions(caregivers)}
                />
            </form>
        </RecordSheet>
    );
}
