import React from "react";
import { Link } from "react-router-dom";
import { IconArrowRight, IconTrash } from "@tabler/icons-react";
import { RecordSheet, SheetPerson, SheetSection, SheetSummaryTile } from "@/components/data/RecordSheet";
import { formatCurrency } from "@/components/dashboard/dashboardFormat";
import { formatTaskPrice } from "@/components/tasks/taskForm";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { calculatePrice } from "@/constants/performedTaskConstants";
import { useAuth } from "@/contexts/AuthContext";
import { useRecordForm } from "@/hooks/useRecordForm";
import { useEditingWhileOpen } from "@/hooks/useEditingWhileOpen";
import { formatDateTime } from "@/utils/formatters";
import { PerformedTaskFields } from "./PerformedTaskFields";
import { formatAmount, recordedTask, requiredCaregiverId, toFormValues, toPersonOptions, toRequest, validatePerformedTask, withMissing } from "./performedTaskForm";

function PerformedTaskView({ performedTask, linkClient }) {
    const { client, caregivers, notes } = performedTask;
    const task = recordedTask(performedTask);
    return (
        <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-3">
                <SheetSummaryTile label="Množství" value={formatAmount(performedTask.unitCount, task.unitType)} />
                <SheetSummaryTile label="Cena" value={formatCurrency(calculatePrice(task, performedTask.unitCount))} />
            </div>

            <SheetSection label="Klient">
                <SheetPerson name={client.fullName}>
                    {linkClient && <Button asChild variant="ghost" size="icon-sm" aria-label={`Otevřít detail klienta ${client.fullName}`}>
                        <Link to={`/clients/${client.id}`}><IconArrowRight /></Link>
                    </Button>}
                </SheetPerson>
            </SheetSection>

            <Separator />

            <SheetSection label={caregivers.length > 1 ? "Pečovatelé" : "Pečovatel"}>
                <div className="grid gap-3">
                    {caregivers.map((caregiver) => <SheetPerson key={caregiver.id} name={caregiver.fullName} />)}
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
 * (caregivers looking at a record they did not take part in, clients). `linkClient` links the client's detail page.
 */
export function PerformedTaskSheet({ open, onOpenChange, performedTask, isLoading, canEdit, linkClient = true, clients = [], tasks = [], caregivers = [], onSave, onDelete }) {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useEditingWhileOpen(open);
    const form = useRecordForm(toFormValues(performedTask));

    const clientsWithCurrent = withMissing(clients, [performedTask?.client]);
    // the record's own task keeps the price it was recorded with, a different task is priced from the catalog
    const currentTask = performedTask && recordedTask(performedTask);
    const tasksWithCurrent = currentTask
        ? withMissing(tasks.map((task) => (task.id === currentTask.id ? currentTask : task)), [currentTask])
        : tasks;
    const caregiverOptions = toPersonOptions(withMissing(caregivers, performedTask?.caregivers));

    const startEditing = () => {
        form.reset(toFormValues(performedTask));
        setIsEditing(true);
    };

    const save = async (event) => {
        event.preventDefault();
        const validate = (values) => validatePerformedTask(values, tasksWithCurrent.find((task) => task.id === values.taskId), requiredCaregiverId(user));
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
            subtitle={!isEditing && currentTask && formatTaskPrice(currentTask)}
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
                <PerformedTaskView performedTask={performedTask} linkClient={linkClient} />
            ))}
        </RecordSheet>
    );
}
