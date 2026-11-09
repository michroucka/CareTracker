import React from "react";
import { IconBan, IconCircleCheck, IconUser, IconUsers } from "@tabler/icons-react";
import { RecordSheet, SheetSection, SheetSummaryTile } from "@/components/data/RecordSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRecordForm } from "@/hooks/useRecordForm";
import { TaskFields } from "./TaskFields";
import { formatTaskPrice, toFormValues, toRequest, unitTypeLabel, validateTask } from "./taskForm";

function TaskView({ task }) {
    return (
        <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-3">
                <SheetSummaryTile label="Cena" value={formatTaskPrice(task)} valueClassName="text-xl" />
                <SheetSummaryTile label="Jednotka" value={unitTypeLabel(task.unitType)} valueClassName="text-xl" />
            </div>
            <SheetSection label="Setkání s klientem">
                <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                        {task.doubleMeeting ? <IconUsers className="size-5" /> : <IconUser className="size-5" />}
                    </span>
                    <div className="grid gap-0.5">
                        <p className="font-medium">{task.doubleMeeting ? "Dvojité setkání" : "Jedno setkání"}</p>
                        <p className="text-sm text-muted-foreground">
                            {task.doubleMeeting ? "Jeden zapsaný úkon se do počtu setkání s klientem započítá dvakrát." : "Jeden zapsaný úkon se počítá jako jedno setkání s klientem."}
                        </p>
                    </div>
                </div>
            </SheetSection>
        </div>
    );
}

/**
 * Catalog task detail. Without `canEdit` it is read-only (caregivers and coordinators).
 */
export function TaskSheet({ open, onOpenChange, task, isLoading, canEdit, organizationId, onSave, onTerminate, onActivate }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const form = useRecordForm(toFormValues(task));

    React.useEffect(() => {
        if (!open) setIsEditing(false);
    }, [open]);

    const startEditing = () => {
        form.reset(toFormValues(task));
        setIsEditing(true);
    };

    const save = async (event) => {
        event.preventDefault();
        const saved = await form.submit(validateTask, (values) => onSave(task.id, toRequest(values, organizationId)));
        if (saved) setIsEditing(false);
    };

    const canAct = Boolean(task && canEdit && !isEditing);
    const moreActions = canAct && (
        <>
            {task.active ? (
                <DropdownMenuItem variant="destructive" onSelect={onTerminate}><IconBan /> Deaktivovat úkon</DropdownMenuItem>
            ) : (
                <DropdownMenuItem onSelect={onActivate}><IconCircleCheck /> Aktivovat úkon</DropdownMenuItem>
            )}
        </>
    );

    const footer = isEditing && (
        <>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={form.isSubmitting}>Zrušit</Button>
            <Button type="submit" form="task-edit-form" disabled={form.isSubmitting}>{form.isSubmitting ? "Ukládám…" : "Uložit změny"}</Button>
        </>
    );

    return (
        <RecordSheet
            open={open}
            onOpenChange={onOpenChange}
            badge="Úkon z katalogu"
            meta={task && !task.active && <Badge variant="outline">Neaktivní</Badge>}
            title={isEditing ? "Úprava úkonu" : task?.name}
            description={task ? `Detail úkonu ${task.name}` : "Detail úkonu"}
            isLoading={isLoading || !task}
            onEdit={canAct ? startEditing : undefined}
            moreActions={moreActions}
            footer={footer}
            contentKey={isEditing ? "edit" : "view"}
        >
            {task && (isEditing ? (
                <form id="task-edit-form" noValidate onSubmit={save}>
                    <TaskFields idPrefix="task-edit" values={form.values} errors={form.errors} onChange={form.setField} disabled={form.isSubmitting} shakeSignal={form.submitCount} />
                </form>
            ) : (
                <TaskView task={task} />
            ))}
        </RecordSheet>
    );
}
