import React from "react";
import { IconDownload, IconLoader2, IconPrinter } from "@tabler/icons-react";
import { Combobox } from "@/components/Combobox";
import { FormField } from "@/components/FormField";
import MonthYearPicker from "@/components/MonthYearPicker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePerformedTasks } from "@/hooks/usePerformedTasks";
import { removeDiacritics } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { personName } from "./performedTaskForm";

const MODES = [
    { value: "client", label: "Jeden klient" },
    { value: "department", label: "Celé středisko" },
];

/** "Marie Nováková" → "marie-novakova" */
const toFileNamePart = (text) => removeDiacritics(text).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function printPdf(blob) {
    const url = URL.createObjectURL(blob);
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.src = url;
    document.body.appendChild(frame);
    frame.onload = () => frame.contentWindow.print();
}

function downloadPdf(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

function ModeSwitch({ value, onChange, disabled }) {
    return (
        <div role="radiogroup" aria-label="Pro koho" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {MODES.map((mode) => (
                <button
                    key={mode.value}
                    type="button"
                    role="radio"
                    aria-checked={value === mode.value}
                    disabled={disabled}
                    onClick={() => onChange(mode.value)}
                    className={cn(
                        "h-8 rounded-md text-sm font-medium text-muted-foreground transition-colors duration-fast ease-out outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        value === mode.value && "bg-card text-foreground shadow-xs"
                    )}
                >
                    {mode.label}
                </button>
            ))}
        </div>
    );
}

/**
 * Monthly receipts (PDF) to print or download: for one client, or for all clients of a department who
 * received care in the month (one PDF, a page per client). Starts on the month shown in the list.
 * Without `canChooseDepartment` the department is fixed to `defaultDepartmentId` (coordinators, caregivers).
 */
export function ReceiptDialog({ open, onOpenChange, clients, departments, defaultDepartmentId, canChooseDepartment, initialMonth }) {
    const { fetchReceipt, fetchDepartmentReceipts } = usePerformedTasks();
    const [mode, setMode] = React.useState("client");
    const [clientId, setClientId] = React.useState(null);
    const [departmentId, setDepartmentId] = React.useState(defaultDepartmentId ?? null);
    const [period, setPeriod] = React.useState(initialMonth);
    const [error, setError] = React.useState(null);
    const [submitCount, setSubmitCount] = React.useState(0);
    const [pendingAction, setPendingAction] = React.useState(null);

    React.useEffect(() => {
        if (!open) return;
        setMode("client");
        setClientId(null);
        setDepartmentId(defaultDepartmentId ?? departments[0]?.id ?? null);
        setPeriod(initialMonth);
        setError(null);
        // reset only when the dialog opens, not when the list filters change behind it
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const isDepartmentMode = mode === "department";
    const department = departments.find((candidate) => candidate.id === departmentId);
    const client = clients.find((candidate) => candidate.id === clientId);
    const periodPart = `${period.year}-${String(period.month + 1).padStart(2, "0")}`;

    const run = async (action) => {
        setSubmitCount((count) => count + 1);
        if (isDepartmentMode ? !departmentId : !clientId) {
            setError(isDepartmentMode ? "Prosím vyberte středisko" : "Prosím vyberte klienta");
            return;
        }
        setPendingAction(action);
        try {
            const blob = isDepartmentMode
                ? await fetchDepartmentReceipts(departmentId, period.month, period.year)
                : await fetchReceipt(clientId, period.month, period.year);
            const fileName = isDepartmentMode
                ? `stvrzenky-${toFileNamePart(department?.city ?? String(departmentId))}-${periodPart}.pdf`
                : `stvrzenka-${toFileNamePart(personName(client))}-${periodPart}.pdf`;
            if (action === "print") printPdf(blob);
            else downloadPdf(blob, fileName);
        } catch {
            // the hook already shows an error toast
        } finally {
            setPendingAction(null);
        }
    };

    const changeMode = (nextMode) => {
        setMode(nextMode);
        setError(null);
    };

    const isPending = pendingAction !== null;

    return (
        <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Stvrzenka za měsíc</DialogTitle>
                    <DialogDescription>
                        {isDepartmentMode
                            ? "Stvrzenky všech klientů střediska, kterým byla v měsíci poskytnuta péče. Každý klient na vlastní stránce."
                            : "Přehled úkonů a částky k úhradě pro jednoho klienta."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <ModeSwitch value={mode} onChange={changeMode} disabled={isPending} />
                    {isDepartmentMode ? (
                        <FormField id="receipt-department" label="Středisko" required error={error} shakeSignal={submitCount}>
                            {(controlProps) => (
                                <Select
                                    value={departmentId ? String(departmentId) : ""}
                                    onValueChange={(id) => { setDepartmentId(Number(id)); setError(null); }}
                                    disabled={isPending || !canChooseDepartment}
                                >
                                    <SelectTrigger {...controlProps} className="w-full"><SelectValue placeholder="Vyberte středisko" /></SelectTrigger>
                                    <SelectContent>
                                        {departments.map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.city}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        </FormField>
                    ) : (
                        <FormField id="receipt-client" label="Klient" required error={error} shakeSignal={submitCount}>
                            {(controlProps) => (
                                <Combobox
                                    {...controlProps}
                                    options={clients.map((option) => ({ value: option.id, label: personName(option), description: option.city }))}
                                    value={clientId}
                                    onChange={(id) => { setClientId(id); setError(null); }}
                                    placeholder="Vyberte klienta"
                                    searchPlaceholder="Hledat klienta…"
                                    disabled={isPending}
                                />
                            )}
                        </FormField>
                    )}
                    <div className="grid gap-1.5">
                        <span className="text-sm">Měsíc</span>
                        <MonthYearPicker value={period} onChange={setPeriod} isDisabled={isPending} className="w-full" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => run("print")} disabled={isPending}>
                        {pendingAction === "print" ? <IconLoader2 className="animate-spin" /> : <IconPrinter />} Vytisknout
                    </Button>
                    <Button onClick={() => run("download")} disabled={isPending}>
                        {pendingAction === "download" ? <IconLoader2 className="animate-spin" /> : <IconDownload />} Stáhnout PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
