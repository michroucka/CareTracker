import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecordForm } from "@/hooks/useRecordForm";
import { TaskFields } from "./TaskFields";
import { EMPTY_TASK, toRequest, validateTask } from "./taskForm";

export function TaskCreateDialog({ open, onOpenChange, onCreate, organizationId }) {
    const form = useRecordForm(EMPTY_TASK);
    const { reset } = form;

    React.useEffect(() => {
        if (open) reset(EMPTY_TASK);
    }, [open, reset]);

    const create = async (event) => {
        event.preventDefault();
        const created = await form.submit(validateTask, (values) => onCreate(toRequest(values, organizationId)));
        if (created) onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(next) => !form.isSubmitting && onOpenChange(next)}>
            <DialogContent>
                <form noValidate onSubmit={create} className="grid gap-6">
                    <DialogHeader>
                        <DialogTitle>Nový úkon</DialogTitle>
                        <DialogDescription>Služba, kterou pečovatelé zapisují a která se klientům účtuje.</DialogDescription>
                    </DialogHeader>
                    <TaskFields idPrefix="task-create" values={form.values} errors={form.errors} onChange={form.setField} disabled={form.isSubmitting} shakeSignal={form.submitCount} />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.isSubmitting}>Zrušit</Button>
                        <Button type="submit" disabled={form.isSubmitting}>{form.isSubmitting ? "Vytvářím…" : "Vytvořit úkon"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
