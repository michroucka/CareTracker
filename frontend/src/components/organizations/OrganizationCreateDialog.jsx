import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecordForm } from "@/hooks/useRecordForm";
import { OrganizationFields } from "./OrganizationFields";
import { EMPTY_ORGANIZATION, toRequest, validateOrganization } from "./organizationForm";

export function OrganizationCreateDialog({ open, onOpenChange, onCreate }) {
    const form = useRecordForm(EMPTY_ORGANIZATION);
    const { reset } = form;

    React.useEffect(() => {
        if (open) reset(EMPTY_ORGANIZATION);
    }, [open, reset]);

    const create = async (event) => {
        event.preventDefault();
        const created = await form.submit(validateOrganization, (values) => onCreate(toRequest(values)));
        if (created) onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(next) => !form.isSubmitting && onOpenChange(next)}>
            <DialogContent>
                <form noValidate onSubmit={create} className="grid gap-6">
                    <DialogHeader>
                        <DialogTitle>Nová organizace</DialogTitle>
                        <DialogDescription>Vedoucího vyberete v detailu, až budou v organizaci zaměstnanci.</DialogDescription>
                    </DialogHeader>
                    <OrganizationFields
                        idPrefix="organization-create"
                        values={form.values}
                        errors={form.errors}
                        onChange={form.setField}
                        disabled={form.isSubmitting}
                        shakeSignal={form.submitCount}
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.isSubmitting}>Zrušit</Button>
                        <Button type="submit" disabled={form.isSubmitting}>{form.isSubmitting ? "Vytvářím…" : "Vytvořit organizaci"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
