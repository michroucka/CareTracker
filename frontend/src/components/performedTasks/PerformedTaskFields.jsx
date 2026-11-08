import React from "react";
import { Combobox } from "@/components/Combobox";
import { DatePicker } from "@/components/DatePicker";
import { FormField } from "@/components/FormField";
import { MultiCombobox } from "@/components/MultiCombobox";
import { TimePicker } from "@/components/ui/time-picker";
import { formatCurrency, pluralize } from "@/components/dashboard/dashboardFormat";
import { formatTaskPrice } from "@/components/tasks/taskForm";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayIsoDate } from "@/lib/dates";
import { allowsDecimals, amountLabel, MIN_DATE, personName, previewPrice, TIME_STEP } from "./performedTaskForm";

const clientTaskIds = (client) => client?.tasks?.map((task) => task.id) ?? [];

/**
 * Performed task form fields. The task list follows the selected client's care plan;
 * "všechny úkony" opens the whole catalog (it starts on when the edited task is outside the plan).
 */
export function PerformedTaskFields({ idPrefix, values, errors, onChange, disabled, shakeSignal, clients, tasks, caregivers }) {
    const selectedClient = clients.find((client) => client.id === values.clientId);
    const selectedTask = tasks.find((task) => task.id === values.taskId);
    const [showAllTasks, setShowAllTasks] = React.useState(() => Boolean(values.taskId) && !clientTaskIds(selectedClient).includes(values.taskId));

    const needsClient = !selectedClient;
    const hasPlanTasks = clientTaskIds(selectedClient).length > 0;
    // clients without tasks in their plan get the whole catalog
    const offersAllTasks = showAllTasks || !hasPlanTasks;
    const offeredTasks = offersAllTasks ? tasks : tasks.filter((task) => clientTaskIds(selectedClient).includes(task.id));
    const price = previewPrice(selectedTask, values.unitCount);

    const changeClient = (clientId) => {
        onChange("clientId", clientId);
        const client = clients.find((candidate) => candidate.id === clientId);
        const planTaskIds = clientTaskIds(client);
        if (!showAllTasks && planTaskIds.length > 0 && values.taskId && !planTaskIds.includes(values.taskId)) onChange("taskId", null);
    };

    const toggleAllTasks = (checked) => {
        setShowAllTasks(checked);
        if (!checked && values.taskId && !clientTaskIds(selectedClient).includes(values.taskId)) onChange("taskId", null);
    };

    const changeAmount = (event) => {
        const pattern = allowsDecimals(selectedTask?.unitType) ? /[^\d,.]/g : /\D/g;
        onChange("unitCount", event.target.value.replace(pattern, ""));
    };

    return (
        <div className="grid gap-4">
            <FormField id={`${idPrefix}-client`} label="Klient" required error={errors.clientId} shakeSignal={shakeSignal}>
                {(controlProps) => (
                    <Combobox
                        {...controlProps}
                        options={clients.map((client) => ({ value: client.id, label: personName(client), description: client.city }))}
                        value={values.clientId}
                        onChange={changeClient}
                        placeholder="Vyberte klienta"
                        searchPlaceholder="Hledat klienta…"
                        disabled={disabled}
                    />
                )}
            </FormField>

            <div className="grid gap-2">
                <FormField
                    id={`${idPrefix}-task`}
                    label="Úkon"
                    required
                    error={errors.taskId}
                    hint={selectedTask ? formatTaskPrice(selectedTask) : undefined}
                    shakeSignal={shakeSignal}
                >
                    {(controlProps) => (
                        <Combobox
                            {...controlProps}
                            options={offeredTasks.map((task) => ({ value: task.id, label: task.name }))}
                            value={values.taskId}
                            onChange={(taskId) => onChange("taskId", taskId)}
                            placeholder={needsClient ? "Nejdřív vyberte klienta" : "Vyberte úkon"}
                            searchPlaceholder="Hledat úkon…"
                            emptyText={offersAllTasks ? "Nic nenalezeno." : "Klient nemá v plánu žádný takový úkon."}
                            disabled={disabled || needsClient}
                        />
                    )}
                </FormField>
                <div className="flex items-center gap-2">
                    <Checkbox id={`${idPrefix}-all-tasks`} checked={offersAllTasks && !needsClient} onCheckedChange={(checked) => toggleAllTasks(checked === true)} disabled={disabled || needsClient || !hasPlanTasks} />
                    <Label htmlFor={`${idPrefix}-all-tasks`} className="font-normal text-muted-foreground">
                        {!needsClient && !hasPlanTasks ? "Klient nemá v plánu úkony, nabízí se celý katalog" : "Nabízet všechny úkony, nejen z plánu klienta"}
                    </Label>
                </div>
            </div>

            <div className="grid grid-cols-2 items-start gap-3">
                <FormField id={`${idPrefix}-date`} label="Datum" required error={errors.date} shakeSignal={shakeSignal}>
                    {(controlProps) => (
                        <DatePicker {...controlProps} value={values.date} onChange={(date) => onChange("date", date)} minDate={MIN_DATE} maxDate={todayIsoDate()} disabled={disabled} />
                    )}
                </FormField>
                <FormField id={`${idPrefix}-time`} label="Čas" required error={errors.time} shakeSignal={shakeSignal}>
                    {(controlProps) => (
                        <TimePicker
                            id={controlProps.id}
                            aria-invalid={controlProps["aria-invalid"]}
                            value={values.time}
                            onChange={(time) => onChange("time", time)}
                            step={TIME_STEP}
                            max="23:55"
                            allowTyping
                            fullWidth
                            iconPosition="end"
                            loop
                            commitDelay={700}
                            disabled={disabled}
                        />
                    )}
                </FormField>
            </div>

            <div className="grid grid-cols-2 items-start gap-3">
                <FormField id={`${idPrefix}-amount`} label={selectedTask ? amountLabel(selectedTask.unitType) : "Množství"} required error={errors.unitCount} shakeSignal={shakeSignal}>
                    {(controlProps) => (
                        <Input
                            {...controlProps}
                            inputMode={allowsDecimals(selectedTask?.unitType) ? "decimal" : "numeric"}
                            className="tabular-nums"
                            disabled={disabled || !selectedTask}
                            value={values.unitCount}
                            onChange={changeAmount}
                        />
                    )}
                </FormField>
                <div className="grid gap-1.5">
                    <span className="text-sm text-muted-foreground">Cena</span>
                    <p className="flex h-10 items-center font-display text-lg font-semibold tabular-nums" aria-live="polite">
                        {price == null ? "–" : formatCurrency(price)}
                    </p>
                </div>
            </div>

            <FormField id={`${idPrefix}-caregivers`} label="Pečovatelé" required error={errors.caregiverIds} shakeSignal={shakeSignal}>
                {(controlProps) => (
                    <MultiCombobox
                        {...controlProps}
                        options={caregivers}
                        value={values.caregiverIds}
                        onChange={(caregiverIds) => onChange("caregiverIds", caregiverIds)}
                        formatCount={(count) => `${count} ${pluralize(count, ["pečovatel", "pečovatelé", "pečovatelů"])}`}
                        placeholder="Vyberte pečovatele"
                        searchPlaceholder="Hledat pečovatele…"
                        disabled={disabled}
                    />
                )}
            </FormField>

            <FormField id={`${idPrefix}-notes`} label="Poznámka">
                {(controlProps) => <Textarea {...controlProps} disabled={disabled} value={values.notes} onChange={(event) => onChange("notes", event.target.value)} />}
            </FormField>
        </div>
    );
}
