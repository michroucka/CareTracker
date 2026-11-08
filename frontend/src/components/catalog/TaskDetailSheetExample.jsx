import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconExternalLink, IconDots, IconPencil, IconTrash } from "@tabler/icons-react";
import { FormField } from "@/components/FormField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { DURATION, EASE_OUT } from "@/lib/motion";

const AnimatedPanel = motion.div;

const EXAMPLE_TASK = {
    taskName: "Pomoc při osobní hygieně",
    date: "2026-10-24",
    dateLabel: "24. 10. 2026",
    department: "Plzeň-sever",
    amount: "1,5",
    unit: "h",
    price: "232,50 Kč",
    rate: "155 Kč/h",
    client: { name: "Marie Nováková", address: "Úslavská 12, Plzeň" },
    caregivers: [
        { id: 1, name: "Jana Malá" },
        { id: 2, name: "Petr Dvořák" },
    ],
    note: "Klientka dnes odmítla sprchu, provedena hygiena na lůžku. Kůže na zádech bez otlaků.",
};

const ALL_CAREGIVERS = [
    { id: 1, name: "Jana Malá" },
    { id: 2, name: "Petr Dvořák" },
    { id: 3, name: "Lucie Horáková" },
];

const TASK_OPTIONS = ["Pomoc při osobní hygieně", "Dovoz oběda", "Praní a žehlení prádla", "Nákup a pochůzky"];

function initials(name) {
    return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

function SectionLabel({ children }) {
    return <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>;
}

function Person({ name, detail }) {
    return (
        <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                {initials(name)}
            </span>
            <div className="min-w-0">
                <p className="truncate font-medium">{name}</p>
                {detail && <p className="truncate text-sm text-muted-foreground">{detail}</p>}
            </div>
        </div>
    );
}

function DetailView({ task }) {
    return (
        <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted p-4">
                    <p className="text-xs text-muted-foreground">Množství</p>
                    <p className="font-display text-2xl font-semibold tabular-nums">{task.amount} {task.unit}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">sazba {task.rate}</p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                    <p className="text-xs text-muted-foreground">Cena</p>
                    <p className="font-display text-2xl font-semibold tabular-nums">{task.price}</p>
                    <p className="text-xs text-muted-foreground">do výkazu za říjen</p>
                </div>
            </div>

            <section className="grid gap-3">
                <SectionLabel>Klient</SectionLabel>
                <div className="flex items-center justify-between gap-3">
                    <Person name={task.client.name} detail={task.client.address} />
                    <Button variant="ghost" size="icon-sm" aria-label="Otevřít detail klienta">
                        <IconExternalLink />
                    </Button>
                </div>
            </section>

            <Separator />

            <section className="grid gap-3">
                <SectionLabel>Pečovatelé</SectionLabel>
                <div className="grid gap-3">
                    {task.caregivers.map((caregiver) => <Person key={caregiver.id} name={caregiver.name} />)}
                </div>
            </section>

            <Separator />

            <section className="grid gap-2">
                <SectionLabel>Poznámka</SectionLabel>
                <p className="text-pretty">{task.note}</p>
            </section>
        </div>
    );
}

function EditView({ task }) {
    const [caregiverIds, setCaregiverIds] = React.useState(task.caregivers.map((caregiver) => caregiver.id));

    const toggleCaregiver = (id, checked) => {
        setCaregiverIds((previous) => (checked ? [...previous, id] : previous.filter((existing) => existing !== id)));
    };

    return (
        <div className="grid gap-4">
            <FormField id="sheet-task" label="Úkon" required>
                {(controlProps) => (
                    <Select defaultValue={task.taskName}>
                        <SelectTrigger {...controlProps} className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {TASK_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
            </FormField>
            <div className="grid grid-cols-2 gap-3">
                <FormField id="sheet-date" label="Datum" required>
                    {(controlProps) => <Input {...controlProps} type="date" defaultValue={task.date} />}
                </FormField>
                <FormField id="sheet-amount" label={`Množství (${task.unit})`} required>
                    {(controlProps) => <Input {...controlProps} inputMode="decimal" defaultValue={task.amount} />}
                </FormField>
            </div>
            <fieldset className="grid gap-2">
                <legend className="mb-1.5 text-sm">Pečovatelé</legend>
                {ALL_CAREGIVERS.map((caregiver) => (
                    <div key={caregiver.id} className="flex items-center gap-2">
                        <Checkbox
                            id={`sheet-caregiver-${caregiver.id}`}
                            checked={caregiverIds.includes(caregiver.id)}
                            onCheckedChange={(checked) => toggleCaregiver(caregiver.id, checked === true)}
                        />
                        <Label htmlFor={`sheet-caregiver-${caregiver.id}`} className="font-normal">{caregiver.name}</Label>
                    </div>
                ))}
            </fieldset>
            <FormField id="sheet-note" label="Poznámka">
                {(controlProps) => <Textarea {...controlProps} defaultValue={task.note} />}
            </FormField>
        </div>
    );
}

/**
 * Catalog example of the record-detail pattern from PLAN.md section 2.6:
 * header with actions, summary first, sections below, editing in place.
 */
export function TaskDetailSheetExample() {
    const [isEditing, setIsEditing] = React.useState(false);
    const task = EXAMPLE_TASK;

    return (
        <Sheet onOpenChange={(open) => !open && setIsEditing(false)}>
            <SheetTrigger asChild>
                <Button variant="outline">Sheet – detail úkonu</Button>
            </SheetTrigger>
            <SheetContent className="w-full gap-0 sm:max-w-md">
                <SheetHeader className="gap-3 border-b p-5 pr-14">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">Provedený úkon</Badge>
                        <span className="text-sm text-muted-foreground tabular-nums">{task.dateLabel} · {task.department}</span>
                    </div>
                    <SheetTitle className="font-display text-2xl font-semibold tracking-tight">
                        {isEditing ? "Úprava úkonu" : task.taskName}
                    </SheetTitle>
                    <SheetDescription className="sr-only">Detail provedeného úkonu u klienta {task.client.name}</SheetDescription>
                    {!isEditing && (
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}><IconPencil /> Upravit</Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="icon-sm" variant="outline" aria-label="Další akce"><IconDots /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem variant="destructive"><IconTrash /> Smazat úkon</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-5">
                    <AnimatePresence mode="wait" initial={false}>
                        <AnimatedPanel
                            key={isEditing ? "edit" : "detail"}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: DURATION.base, ease: EASE_OUT }}
                        >
                            {isEditing ? <EditView task={task} /> : <DetailView task={task} />}
                        </AnimatedPanel>
                    </AnimatePresence>
                </div>

                {isEditing && (
                    <SheetFooter className="flex-row justify-end border-t p-4">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Zrušit</Button>
                        <Button onClick={() => setIsEditing(false)}>Uložit změny</Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}
