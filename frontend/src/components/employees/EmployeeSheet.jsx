import React from "react";
import { Link } from "react-router-dom";
import { IconArrowRight, IconBan, IconCircleCheck, IconMailForward } from "@tabler/icons-react";
import { PersonAvatar } from "@/components/PersonAvatar";
import { RecordSheet, SheetPerson, SheetSection, SheetSummaryTile } from "@/components/data/RecordSheet";
import { formatCount, formatDuration, pluralize } from "@/components/dashboard/dashboardFormat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getRoleLabel } from "@/constants/roles";
import { useEmployeeOverview } from "@/hooks/useEmployeeOverview";
import { useRecordForm } from "@/hooks/useRecordForm";
import { useEditingWhileOpen } from "@/hooks/useEditingWhileOpen";
import { pictureUrl } from "@/lib/pictures";
import { EmployeeFields } from "./EmployeeFields";
import { accountState, roleOptions, toFormValues, toRequest, validateEmployee } from "./employeeForm";

const MAX_LISTED_CLIENTS = 5;

function DetailItem({ label, children }) {
    return (
        <div className="grid gap-0.5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-medium break-all">{children}</dd>
        </div>
    );
}

function KeyClients({ employee, clients }) {
    if (!clients) {
        return (
            <div className="grid gap-3" role="status" aria-label="Načítání klientů">
                {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-9 w-full rounded-md" />)}
            </div>
        );
    }
    if (clients.length === 0) return <p className="text-sm text-muted-foreground">Není klíčovým pracovníkem žádného aktivního klienta.</p>;

    const sorted = [...clients].sort((a, b) => a.lastName.localeCompare(b.lastName, "cs"));
    return (
        <div className="grid gap-3">
            {sorted.slice(0, MAX_LISTED_CLIENTS).map((client) => {
                const name = `${client.firstName} ${client.lastName}`;
                return (
                    <SheetPerson key={client.id} name={name} src={pictureUrl("clients", client.id, client.pictureId)} description={client.city}>
                        <Button asChild variant="ghost" size="icon-sm" aria-label={`Otevřít detail klienta ${name}`}>
                            <Link to={`/clients/${client.id}`}><IconArrowRight /></Link>
                        </Button>
                    </SheetPerson>
                );
            })}
            {sorted.length > MAX_LISTED_CLIENTS && (
                <Button asChild variant="outline" size="sm" className="justify-self-start">
                    <Link to={`/clients?caregivers=${employee.id}`}>Všichni klienti ({sorted.length})</Link>
                </Button>
            )}
        </div>
    );
}

function EmployeeView({ employee, overview }) {
    const account = accountState(employee);
    const clients = overview?.clients;
    const performedTasks = overview?.performedTasks ?? [];
    const minutesWithClients = performedTasks.filter((task) => task.unitType === "HOUR").reduce((sum, task) => sum + task.unitCount, 0);
    const isLoaded = overview && !overview.failed;

    return (
        <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-3">
                <SheetSummaryTile
                    label="Klíčový pracovník"
                    value={isLoaded ? formatCount(clients.length) : "–"}
                    hint={isLoaded && pluralize(clients.length, ["klient", "klienti", "klientů"])}
                />
                <SheetSummaryTile
                    label="Tento měsíc"
                    value={isLoaded ? formatCount(performedTasks.length) : "–"}
                    hint={isLoaded && (minutesWithClients > 0 ? `${pluralize(performedTasks.length, ["úkon", "úkony", "úkonů"])} · ${formatDuration(minutesWithClients)}` : pluralize(performedTasks.length, ["úkon", "úkony", "úkonů"]))}
                />
            </div>

            <SheetSection label="Klíčový pracovník u">
                {overview?.failed ? <p className="text-sm text-muted-foreground">Klienty se nepodařilo načíst.</p> : <KeyClients employee={employee} clients={clients} />}
            </SheetSection>

            <Separator />

            <SheetSection label="Uživatelský účet">
                {employee.email ? (
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <DetailItem label="Stav"><Badge variant={account.variant}>{account.label}</Badge></DetailItem>
                        <DetailItem label="E-mail">{employee.email}</DetailItem>
                    </dl>
                ) : (
                    <p className="text-sm text-muted-foreground">Zaměstnanec se do aplikace nepřihlašuje. Účet můžete vytvořit v úpravě.</p>
                )}
            </SheetSection>
        </div>
    );
}

/**
 * Employee detail with in-place editing. Without `canEdit` it is read-only (caregivers).
 */
export function EmployeeSheet({ open, onOpenChange, employee, isLoading, canEdit, canManageAdmins, isSelf, organizationId, departments, onSave, onTerminate, onActivate, onResendActivation }) {
    const [isEditing, setIsEditing] = useEditingWhileOpen(open);
    const overview = useEmployeeOverview(open ? employee?.id : null, organizationId);
    const form = useRecordForm(toFormValues(employee));

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

    const canAct = Boolean(employee && canEdit && !isEditing);
    const moreActions = canAct && (
        <>
            {canResend && <DropdownMenuItem onSelect={onResendActivation}><IconMailForward /> Znovu poslat aktivační e-mail</DropdownMenuItem>}
            {canResend && <DropdownMenuSeparator />}
            {employee.active ? (
                <DropdownMenuItem variant="destructive" disabled={isSelf} onSelect={onTerminate}>
                    <IconBan /> {isSelf ? "Sebe nelze deaktivovat" : "Deaktivovat zaměstnance"}
                </DropdownMenuItem>
            ) : (
                <DropdownMenuItem onSelect={onActivate}><IconCircleCheck /> Aktivovat zaměstnance</DropdownMenuItem>
            )}
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
            subtitle={employee && !isEditing && (
                <span className="flex flex-wrap items-center gap-2">
                    {getRoleLabel(employee.role)} · {employee.department?.city}
                    {employee.isAdmin && <Badge variant="secondary">Admin</Badge>}
                </span>
            )}
            avatar={employee && !isEditing && (
                <PersonAvatar name={`${employee.firstName} ${employee.lastName}`} src={pictureUrl("employees", employee.id, employee.pictureId, "full")} className="size-14 font-display text-xl" />
            )}
            description={employee ? `Detail zaměstnance ${fullName}` : "Detail zaměstnance"}
            isLoading={isLoading || !employee}
            onEdit={canAct ? startEditing : undefined}
            moreActions={moreActions}
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
                        hasSavedPicture={Boolean(employee.pictureId)}
                        canManageAdmins={canManageAdmins}
                    />
                </form>
            ) : (
                <EmployeeView employee={employee} overview={overview} />
            ))}
        </RecordSheet>
    );
}
