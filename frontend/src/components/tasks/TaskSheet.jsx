import React from "react";
import { IconBan, IconCircleCheck, IconDots, IconPencil } from "@tabler/icons-react";
import { RecordSheet } from "@/components/data/RecordSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRecordForm } from "@/hooks/useRecordForm";
import { TaskFields } from "./TaskFields";
import { formatTaskPrice, toFormValues, toRequest, unitTypeLabel, validateTask } from "./taskForm";

function SummaryTile({ label, value }) {
    return (
        <div className="rounded-lg bg-muted p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-display text-xl font-semibold tabular-nums">{value}</p>
        </div>
    );
}

function TaskView({ task }) {
    return (
        <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-3">
                <SummaryTile label="Cena" value={formatTaskPrice(task)} />
                <SummaryTile label="Jednotka" value={unitTypeLabel(task.unitType)} />
            </div>
            <p className="text-muted-foreground">
                {task.doubleMeeting ? "Dvojité setkání: jeden zapsaný úkon se do počtu setkání s klientem započítá dvakrát." : "Jeden zapsaný úkon se počítá jako jedno setkání s klientem."}
            </p>
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

    const actions = task && canEdit && !isEditing && (
        <>
            <Button size="sm" variant="outline" onClick={startEditing}><IconPencil /> Upravit</Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon-sm" variant="outline" aria-label="Další akce"><IconDots /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {task.active ? (
                        <DropdownMenuItem variant="destructive" onSelect={onTerminate}><IconBan /> Deaktivovat úkon</DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onSelect={onActivate}><IconCircleCheck /> Aktivovat úkon</DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
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
            actions={actions}
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
