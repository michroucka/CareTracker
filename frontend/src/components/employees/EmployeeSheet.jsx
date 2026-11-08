import React from "react";
import { IconBan, IconCircleCheck, IconDots, IconMailForward, IconPencil } from "@tabler/icons-react";
import { RecordSheet, SheetSection } from "@/components/data/RecordSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { getRoleLabel } from "@/constants/roles";
import { useRecordForm } from "@/hooks/useRecordForm";
import { EmployeeFields } from "./EmployeeFields";
import { accountState, roleOptions, toFormValues, toRequest, validateEmployee } from "./employeeForm";

function DetailRow({ label, children }) {
    return (
        <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium break-all">{children}</dd>
        </div>
    );
}

function EmployeeView({ employee }) {
    const account = accountState(employee);
    return (
        <div className="grid gap-6">
            <SheetSection label="Zařazení">
                <dl className="grid gap-2">
                    <DetailRow label="Role">{getRoleLabel(employee.role)}</DetailRow>
                    <DetailRow label="Středisko">{employee.department?.city ?? "–"}</DetailRow>
                </dl>
            </SheetSection>

            <Separator />

            <SheetSection label="Uživatelský účet">
                <dl className="grid gap-2">
                    <DetailRow label="Stav"><Badge variant={account.variant}>{account.label}</Badge></DetailRow>
                    {employee.email && <DetailRow label="E-mail">{employee.email}</DetailRow>}
                    {employee.email && <DetailRow label="Administrátor">{employee.isAdmin ? "Ano" : "Ne"}</DetailRow>}
                </dl>
                {!employee.email && <p className="text-sm text-muted-foreground">Zaměstnanec se do aplikace nepřihlašuje. Účet můžete vytvořit v úpravě.</p>}
            </SheetSection>
        </div>
    );
}

/**
 * Employee detail with in-place editing. Without `canEdit` it is read-only (caregivers).
 */
export function EmployeeSheet({ open, onOpenChange, employee, isLoading, canEdit, canManageAdmins, isSelf, departments, onSave, onTerminate, onActivate, onResendActivation }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const form = useRecordForm(toFormValues(employee));

    React.useEffect(() => {
        if (!open) setIsEditing(false);
    }, [open]);

    const startEditing = () => {
        form.reset(toFormValues(employee));
        setIsEditing(true);
    };

    const save = async (event) => {
        event.preventDefault();
        const saved = await form.submit(validateEmployee, (values) => onSave(employee.id, toRequest(values)));
        if (saved) setIsEditing(false);
    };

    const fullName = employee && `${employee.firstName} ${employee.lastName}`;
    const canResend = employee?.email && !employee.isActivated;

    const actions = employee && canEdit && !isEditing && (
        <>
            <Button size="sm" variant="outline" onClick={startEditing}><IconPencil /> Upravit</Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon-sm" variant="outline" aria-label="Další akce"><IconDots /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {canResend && <DropdownMenuItem onSelect={onResendActivation}><IconMailForward /> Znovu poslat aktivační e-mail</DropdownMenuItem>}
                    {canResend && <DropdownMenuSeparator />}
                    {employee.active ? (
                        <DropdownMenuItem variant="destructive" disabled={isSelf} onSelect={onTerminate}>
                            <IconBan /> {isSelf ? "Sebe nelze deaktivovat" : "Deaktivovat zaměstnance"}
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onSelect={onActivate}><IconCircleCheck /> Aktivovat zaměstnance</DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );

    const footer = isEditing && (
        <>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={form.isSubmitting}>Zrušit</Button>
            <Button type="submit" form="employee-edit-form" disabled={form.isSubmitting}>{form.isSubmitting ? "Ukládám…" : "Uložit změny"}</Button>
        </>
    );

    const meta = employee && (
        <>
            <span className="text-sm text-muted-foreground">{getRoleLabel(employee.role)} · {employee.department?.city}</span>
            {!employee.active && <Badge variant="outline">Neaktivní</Badge>}
        </>
    );

    return (
        <RecordSheet
            open={open}
            onOpenChange={onOpenChange}
            badge="Zaměstnanec"
            meta={meta}
            title={isEditing ? "Úprava zaměstnance" : fullName}
            description={employee ? `Detail zaměstnance ${fullName}` : "Detail zaměstnance"}
            isLoading={isLoading || !employee}
            actions={actions}
            footer={footer}
            contentKey={isEditing ? "edit" : "view"}
        >
            {employee && (isEditing ? (
                <form id="employee-edit-form" noValidate onSubmit={save}>
                    <EmployeeFields
                        idPrefix="employee-edit"
                        values={form.values}
                        errors={form.errors}
                        onChange={form.setField}
                        disabled={form.isSubmitting}
                        shakeSignal={form.submitCount}
                        roles={roleOptions(canManageAdmins, employee.role)}
                        departments={departments}
                        hasAccount={Boolean(employee.email)}
                        canManageAdmins={canManageAdmins}
                    />
                </form>
            ) : (
                <EmployeeView employee={employee} />
            ))}
        </RecordSheet>
    );
}
