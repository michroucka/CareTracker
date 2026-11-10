import React from "react";
import { IconBan, IconCircleCheck } from "@tabler/icons-react";
import { RecordSheet, SheetSection } from "@/components/data/RecordSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useRecordForm } from "@/hooks/useRecordForm";
import { useEditingWhileOpen } from "@/hooks/useEditingWhileOpen";
import { DepartmentFields } from "./DepartmentFields";
import { coordinatorOptions, formatAddress, toFormValues, toRequest, validateDepartment } from "./departmentForm";

function initials(name = "") {
    return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function DepartmentView({ department }) {
    return (
        <div className="grid gap-6">
            <SheetSection label="Adresa">
                <p className="font-medium">{formatAddress(department)}</p>
            </SheetSection>

            <Separator />

            <SheetSection label="Koordinátor">
                {department.coordinator ? (
                    <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                            {initials(department.coordinator.fullName)}
                        </span>
                        <p className="font-medium">{department.coordinator.fullName}</p>
                    </div>
                ) : (
                    <p className="text-muted-foreground">Středisko zatím nemá koordinátora.</p>
                )}
            </SheetSection>
        </div>
    );
}

export function DepartmentSheet({ open, onOpenChange, department, isLoading, employees, organizationId, onSave, onTerminate, onActivate }) {
    const [isEditing, setIsEditing] = useEditingWhileOpen(open);
    const form = useRecordForm(toFormValues(department));

    const startEditing = () => {
        form.reset(toFormValues(department));
        setIsEditing(true);
    };

    const save = async (event) => {
        event.preventDefault();
        const saved = await form.submit(validateDepartment, (values) => onSave(department.id, toRequest(values, organizationId)));
        if (saved) setIsEditing(false);
    };

    const canAct = Boolean(department && !isEditing);
    const moreActions = canAct && (
        <>
            {department.active ? (
                <DropdownMenuItem variant="destructive" onSelect={onTerminate}><IconBan /> Deaktivovat středisko</DropdownMenuItem>
            ) : (
                <DropdownMenuItem onSelect={onActivate}><IconCircleCheck /> Aktivovat středisko</DropdownMenuItem>
            )}
        </>
    );

    const footer = isEditing && (
        <>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={form.isSubmitting}>Zrušit</Button>
            <Button type="submit" form="department-edit-form" disabled={form.isSubmitting}>
                {form.isSubmitting ? "Ukládám…" : "Uložit změny"}
            </Button>
        </>
    );

    const meta = department && (
        <>
            {department.departmentNumber != null && <span className="text-sm text-muted-foreground">č. {department.departmentNumber}</span>}
            {!department.active && <Badge variant="outline">Neaktivní</Badge>}
        </>
    );

    return (
        <RecordSheet
            open={open}
            onOpenChange={onOpenChange}
            badge="Středisko"
            meta={meta}
            title={isEditing ? "Úprava střediska" : department?.city}
            description={department ? `Detail střediska ${department.city}` : "Detail střediska"}
            isLoading={isLoading || !department}
            onEdit={canAct ? startEditing : undefined}
            moreActions={moreActions}
            footer={footer}
            contentKey={isEditing ? "edit" : "view"}
        >
            {department && (isEditing ? (
                <form id="department-edit-form" noValidate onSubmit={save}>
                    <DepartmentFields
                        idPrefix="department-edit"
                        values={form.values}
                        errors={form.errors}
                        onChange={form.setField}
                        disabled={form.isSubmitting}
                        shakeSignal={form.submitCount}
                        coordinatorOptions={coordinatorOptions(employees, department.coordinator?.id)}
                    />
                </form>
            ) : (
                <DepartmentView department={department} />
            ))}
        </RecordSheet>
    );
}
