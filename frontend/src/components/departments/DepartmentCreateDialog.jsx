import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecordForm } from "@/hooks/useRecordForm";
import { DepartmentFields } from "./DepartmentFields";
import { coordinatorOptions, EMPTY_DEPARTMENT, toRequest, validateDepartment } from "./departmentForm";

export function DepartmentCreateDialog({ open, onOpenChange, onCreate, employees, organizationId }) {
    const form = useRecordForm(EMPTY_DEPARTMENT);
    const { reset } = form;

    React.useEffect(() => {
        if (open) reset(EMPTY_DEPARTMENT);
    }, [open, reset]);

    const create = async (event) => {
        event.preventDefault();
        const created = await form.submit(validateDepartment, (values) => onCreate(toRequest(values, organizationId)));
        if (created) onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(next) => !form.isSubmitting && onOpenChange(next)}>
            <DialogContent>
                <form noValidate onSubmit={create} className="grid gap-6">
                    <DialogHeader>
                        <DialogTitle>Nové středisko</DialogTitle>
                        <DialogDescription>Regionální pobočka organizace s vlastními klienty a pečovateli.</DialogDescription>
                    </DialogHeader>
                    <DepartmentFields
                        idPrefix="department-create"
                        values={form.values}
                        errors={form.errors}
                        onChange={form.setField}
                        disabled={form.isSubmitting}
                        shakeSignal={form.submitCount}
                        coordinatorOptions={coordinatorOptions(employees, null)}
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.isSubmitting}>Zrušit</Button>
                        <Button type="submit" disabled={form.isSubmitting}>{form.isSubmitting ? "Vytvářím…" : "Vytvořit středisko"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
