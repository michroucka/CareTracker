import React from "react";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRecordForm } from "@/hooks/useRecordForm";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values) {
    if (!values.email.trim()) return { email: "Prosím zadejte e-mail" };
    if (!EMAIL.test(values.email.trim())) return { email: "Zadejte platnou e-mailovou adresu" };
    return {};
}

/**
 * Creates a read-only account for the client (monthly overview); an activation link goes to the e-mail.
 */
export function ClientAccountDialog({ open, onOpenChange, client, onCreate }) {
    const form = useRecordForm({ email: "" });
    const { reset } = form;

    React.useEffect(() => {
        if (open) reset({ email: client?.email ?? "" });
    }, [open, reset, client]);

    const submit = async (event) => {
        event.preventDefault();
        const done = await form.submit(validate, (values) => onCreate(client.id, values.email.trim()));
        if (done) onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(next) => !form.isSubmitting && onOpenChange(next)}>
            <DialogContent>
                <form noValidate onSubmit={submit} className="grid gap-6">
                    <DialogHeader>
                        <DialogTitle>Účet pro klienta</DialogTitle>
                        <DialogDescription>
                            {client?.fullName} uvidí v aplikaci svůj měsíční přehled péče. Na e-mail přijde odkaz pro aktivaci účtu.
                        </DialogDescription>
                    </DialogHeader>
                    <FormField id="client-account-email" label="E-mail" required error={form.errors.email} shakeSignal={form.submitCount}>
                        {(controlProps) => (
                            <Input {...controlProps} type="email" autoFocus autoComplete="email" disabled={form.isSubmitting} value={form.values.email}
                                onChange={(event) => form.setField("email", event.target.value)} />
                        )}
                    </FormField>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.isSubmitting}>Zrušit</Button>
                        <Button type="submit" disabled={form.isSubmitting}>{form.isSubmitting ? "Vytvářím…" : "Vytvořit účet"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
