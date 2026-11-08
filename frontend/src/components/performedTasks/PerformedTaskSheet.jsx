import React from "react";
import { Link } from "react-router-dom";
import { IconArrowRight, IconTrash } from "@tabler/icons-react";
import { RecordSheet, SheetSection } from "@/components/data/RecordSheet";
import { formatCurrency } from "@/components/dashboard/dashboardFormat";
import { formatTaskPrice } from "@/components/tasks/taskForm";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { calculatePrice } from "@/constants/performedTaskConstants";
import { useRecordForm } from "@/hooks/useRecordForm";
import { formatDateTime } from "@/utils/formatters";
import { PerformedTaskFields } from "./PerformedTaskFields";
import { formatAmount, toFormValues, toPersonOptions, toRequest, validatePerformedTask, withMissing } from "./performedTaskForm";

function initials(name) {
    return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function Person({ name, children }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">{initials(name)}</span>
                <p className="truncate font-medium">{name}</p>
            </div>
            {children}
        </div>
    );
}

function SummaryTile({ label, value }) {
    return (
        <div className="rounded-lg bg-muted p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
        </div>
    );
}

function PerformedTaskView({ performedTask }) {
    const { task, client, caregivers, notes } = performedTask;
    return (
        <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-3">
                <SummaryTile label="Množství" value={formatAmount(performedTask.unitCount, task.unitType)} />
                <SummaryTile label="Cena" value={formatCurrency(calculatePrice(task, performedTask.unitCount))} />
            </div>

            <SheetSection label="Klient">
                <Person name={client.fullName}>
                    <Button asChild variant="ghost" size="icon-sm" aria-label={`Otevřít detail klienta ${client.fullName}`}>
                        <Link to={`/clients/${client.id}`}><IconArrowRight /></Link>
                    </Button>
                </Person>
            </SheetSection>

            <Separator />

            <SheetSection label={caregivers.length > 1 ? "Pečovatelé" : "Pečovatel"}>
                <div className="grid gap-3">
                    {caregivers.map((caregiver) => <Person key={caregiver.id} name={caregiver.fullName} />)}
                </div>
            </SheetSection>

            <Separator />

            <SheetSection label="Poznámka">
                {notes ? <p className="text-pretty whitespace-pre-line">{notes}</p> : <p className="text-sm text-muted-foreground">Bez poznámky.</p>}
            </SheetSection>
        </div>
    );
}

/**
 * Performed task detail with in-place editing. Without `canEdit` it is read-only
 * (caregivers looking at a record they did not take part in).
 */
export function PerformedTaskSheet({ open, onOpenChange, performedTask, isLoading, canEdit, clients, tasks, caregivers, onSave, onDelete }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const form = useRecordForm(toFormValues(performedTask));

    React.useEffect(() => {
        if (!open) setIsEditing(false);
    }, [open]);

    const clientsWithCurrent = withMissing(clients, [performedTask?.client]);
    const tasksWithCurrent = withMissing(tasks, [performedTask?.task]);
    const caregiverOptions = toPersonOptions(withMissing(caregivers, performedTask?.caregivers));

    const startEditing = () => {
        form.reset(toFormValues(performedTask));
        setIsEditing(true);
    };

    const save = async (event) => {
        event.preventDefault();
        const validate = (values) => validatePerformedTask(values, tasksWithCurrent.find((task) => task.id === values.taskId));
        const saved = await form.submit(validate, (values) => onSave(performedTask.id, toRequest(values)));
        if (saved) setIsEditing(false);
    };

    const canAct = Boolean(performedTask && canEdit && !isEditing);
    const moreActions = canAct && (
        <DropdownMenuItem variant="destructive" onSelect={onDelete}><IconTrash /> Smazat záznam</DropdownMenuItem>
    );

    const footer = isEditing && (
        <>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={form.isSubmitting}>Zrušit</Button>
            <Button type="submit" form="performed-task-edit-form" disabled={form.isSubmitting}>{form.isSubmitting ? "Ukládám…" : "Uložit změny"}</Button>
        </>
    );

    const meta = performedTask && (
        <span className="text-sm text-muted-foreground tabular-nums">
            {formatDateTime(performedTask.date)}{performedTask.department && ` · ${performedTask.department.city}`}
        </span>
    );

    return (
        <RecordSheet
            open={open}
            onOpenChange={onOpenChange}
            badge="Provedený úkon"
            meta={meta}
            title={isEditing ? "Úprava záznamu" : performedTask?.task.name}
            subtitle={!isEditing && performedTask && formatTaskPrice(performedTask.task)}
            description={performedTask ? `Detail úkonu u klienta ${performedTask.client.fullName}` : "Detail provedeného úkonu"}
            isLoading={isLoading || !performedTask}
            onEdit={canAct ? startEditing : undefined}
            moreActions={moreActions}
            footer={footer}
            contentKey={isEditing ? "edit" : "view"}
        >
            {performedTask && (isEditing ? (
                <form id="performed-task-edit-form" noValidate onSubmit={save}>
                    <PerformedTaskFields
                        idPrefix="performed-task-edit"
                        values={form.values}
                        errors={form.errors}
                        onChange={form.setField}
                        disabled={form.isSubmitting}
                        shakeSignal={form.submitCount}
                        clients={clientsWithCurrent}
                        tasks={tasksWithCurrent}
                        caregivers={caregiverOptions}
                    />
                </form>
            ) : (
                <PerformedTaskView performedTask={performedTask} />
            ))}
        </RecordSheet>
    );
}
