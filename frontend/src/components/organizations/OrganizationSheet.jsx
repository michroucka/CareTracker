import React from "react";
import { IconBan, IconCircleCheck } from "@tabler/icons-react";
import { RecordSheet, SheetSection } from "@/components/data/RecordSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useRecordForm } from "@/hooks/useRecordForm";
import { useEditingWhileOpen } from "@/hooks/useEditingWhileOpen";
import { OrganizationFields } from "./OrganizationFields";
import { formatBankAccount, toFormValues, toRequest, validateOrganization } from "./organizationForm";

function initials(name = "") {
    return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function OrganizationView({ organization }) {
    const bankAccount = formatBankAccount(organization);
    return (
        <div className="grid gap-6">
            <SheetSection label="Vedoucí">
                {organization.manager ? (
                    <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                            {initials(organization.manager.fullName)}
                        </span>
                        <p className="font-medium">{organization.manager.fullName}</p>
                    </div>
                ) : (
                    <p className="text-muted-foreground">Organizace zatím nemá vedoucího.</p>
                )}
            </SheetSection>

            <Separator />

            <SheetSection label="Bankovní účet">
                {bankAccount ? (
                    <p className="font-medium tabular-nums">{bankAccount}</p>
                ) : (
                    <p className="text-muted-foreground">Nevyplněn. Bez účtu se ve vyúčtování klientů nezobrazí QR kód pro platbu.</p>
                )}
            </SheetSection>
        </div>
    );
}

/**
 * Organization detail with in-place editing. `employees` are the organization's employees for the manager field.
 */
export function OrganizationSheet({ open, onOpenChange, organization, isLoading, employees, onSave, onTerminate, onActivate }) {
    const [isEditing, setIsEditing] = useEditingWhileOpen(open);
    const form = useRecordForm(toFormValues(organization));

    const startEditing = () => {
        form.reset(toFormValues(organization));
        setIsEditing(true);
    };

    const save = async (event) => {
        event.preventDefault();
        const saved = await form.submit(validateOrganization, (values) => onSave(organization.id, toRequest(values)));
        if (saved) setIsEditing(false);
    };

    const managerOptions = employees.map((employee) => ({
        value: employee.id,
        label: `${employee.firstName} ${employee.lastName}`,
        description: employee.department?.city,
    }));

    const canAct = Boolean(organization && !isEditing);
    const moreActions = canAct && (
        <>
            {organization.active ? (
                <DropdownMenuItem variant="destructive" onSelect={onTerminate}><IconBan /> Deaktivovat organizaci</DropdownMenuItem>
            ) : (
                <DropdownMenuItem onSelect={onActivate}><IconCircleCheck /> Aktivovat organizaci</DropdownMenuItem>
            )}
        </>
    );

    const footer = isEditing && (
        <>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={form.isSubmitting}>Zrušit</Button>
            <Button type="submit" form="organization-edit-form" disabled={form.isSubmitting}>
                {form.isSubmitting ? "Ukládám…" : "Uložit změny"}
            </Button>
        </>
    );

    return (
        <RecordSheet
            open={open}
            onOpenChange={onOpenChange}
            badge="Organizace"
            meta={organization && !organization.active && <Badge variant="outline">Neaktivní</Badge>}
            title={isEditing ? "Úprava organizace" : organization?.name}
            description={organization ? `Detail organizace ${organization.name}` : "Detail organizace"}
            isLoading={isLoading || !organization}
            onEdit={canAct ? startEditing : undefined}
            moreActions={moreActions}
            footer={footer}
            contentKey={isEditing ? "edit" : "view"}
        >
            {organization && (isEditing ? (
                <form id="organization-edit-form" noValidate onSubmit={save}>
                    <OrganizationFields
                        idPrefix="organization-edit"
                        values={form.values}
                        errors={form.errors}
                        onChange={form.setField}
                        disabled={form.isSubmitting}
                        shakeSignal={form.submitCount}
                        managerOptions={managerOptions}
                    />
                </form>
            ) : (
                <OrganizationView organization={organization} />
            ))}
        </RecordSheet>
    );
}
