import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecordForm } from "@/hooks/useRecordForm";
import { EmployeeFields } from "./EmployeeFields";
import { emptyEmployee, roleOptions, toRequest, validateEmployee } from "./employeeForm";

export function EmployeeCreateDialog({ open, onOpenChange, onCreate, departments, defaultDepartmentId, canManageAdmins }) {
    const form = useRecordForm(emptyEmployee(defaultDepartmentId));
    const { reset } = form;

    React.useEffect(() => {
        if (open) reset(emptyEmployee(defaultDepartmentId));
    }, [open, reset, defaultDepartmentId]);

    const create = async (event) => {
        event.preventDefault();
        const created = await form.submit(validateEmployee, (values) => onCreate(toRequest(values)));
        if (created) onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(next) => !form.isSubmitting && onOpenChange(next)}>
            <DialogContent className="sm:max-w-xl">
                <form noValidate onSubmit={create} className="grid gap-6">
                    <DialogHeader>
                        <DialogTitle>Nový zaměstnanec</DialogTitle>
                        <DialogDescription>Pečovatelé, koordinátoři a vedení organizace.</DialogDescription>
                    </DialogHeader>
                    <EmployeeFields
                        idPrefix="employee-create"
                        values={form.values}
                        errors={form.errors}
                        onChange={form.setField}
                        disabled={form.isSubmitting}
                        shakeSignal={form.submitCount}
                        roles={roleOptions(canManageAdmins)}
                        departments={departments}
                        hasAccount={false}
                        canManageAdmins={canManageAdmins}
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.isSubmitting}>Zrušit</Button>
                        <Button type="submit" disabled={form.isSubmitting}>{form.isSubmitting ? "Vytvářím…" : "Vytvořit zaměstnance"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
