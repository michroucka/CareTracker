import React from "react";
import { Combobox } from "@/components/Combobox";
import { DatePicker } from "@/components/DatePicker";
import { FormField } from "@/components/FormField";
import { MultiCombobox } from "@/components/MultiCombobox";
import { PhotoInput } from "@/components/PhotoInput";
import { pluralize } from "@/components/dashboard/dashboardFormat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { benefitsOptions, genderOptions, terminationReasonOptions } from "@/constants/clientConstants";
import { todayIsoDate } from "@/lib/dates";
import { formatPhoneNumber, formatPostalCode } from "@/utils/formatters";
import { OLDEST_BIRTH_DATE } from "./clientForm";

function FieldSection({ title, description, children }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="grid gap-4">{children}</CardContent>
        </Card>
    );
}

function OptionSelect({ controlProps, value, onChange, options, placeholder, disabled }) {
    return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger {...controlProps} className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
            <SelectContent>
                {options.map((option) => <SelectItem key={option.key} value={option.key}>{option.name}</SelectItem>)}
            </SelectContent>
        </Select>
    );
}

/**
 * Client form split into cards, shared by the create page and the detail page in edit mode.
 * `withTermination` adds the contract end fields (inactive clients).
 */
export function ClientFields({ idPrefix, values, errors, onChange, disabled, shakeSignal, departments, caregivers, tasks, hasSavedPicture, withTermination }) {
    const containerRef = React.useRef(null);

    // the form is longer than the screen, so bring the first invalid field into view after a failed submit
    React.useEffect(() => {
        const firstInvalid = containerRef.current?.querySelector("[aria-invalid='true']");
        firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalid?.focus({ preventScroll: true });
    }, [shakeSignal]);

    const update = (field) => (event) => onChange(field, event.target.value);
    const field = (name, label, props = {}) => ({ id: `${idPrefix}-${name}`, label, error: errors[name], shakeSignal, ...props });

    const caregiverOptions = caregivers
        .filter((caregiver) => !values.departmentId || caregiver.department?.id === values.departmentId)
        .map((caregiver) => ({ value: caregiver.id, label: `${caregiver.firstName} ${caregiver.lastName}` }));
    const taskOptions = tasks.map((task) => ({ value: task.id, label: task.name }));

    const changeDepartment = (departmentId) => {
        onChange("departmentId", departmentId);
        const caregiver = caregivers.find((candidate) => candidate.id === values.caregiverId);
        if (caregiver && caregiver.department?.id !== departmentId) onChange("caregiverId", null);
    };

    return (
        <div ref={containerRef} className="grid gap-6">
            <FieldSection title="Osobní údaje">
                <PhotoInput id={`${idPrefix}-picture`} value={values.picture} onChange={(picture) => onChange("picture", picture)} name={`${values.firstName} ${values.lastName}`} hasSavedPicture={hasSavedPicture} disabled={disabled} />
                <div className="grid items-start gap-4 sm:grid-cols-2">
                    <FormField {...field("firstName", "Jméno", { required: true })}>
                        {(controlProps) => <Input {...controlProps} autoComplete="off" disabled={disabled} value={values.firstName} onChange={update("firstName")} />}
                    </FormField>
                    <FormField {...field("lastName", "Příjmení", { required: true })}>
                        {(controlProps) => <Input {...controlProps} autoComplete="off" disabled={disabled} value={values.lastName} onChange={update("lastName")} />}
                    </FormField>
                    <FormField {...field("gender", "Pohlaví", { required: true })}>
                        {(controlProps) => (
                            <OptionSelect controlProps={controlProps} value={values.gender} onChange={(gender) => onChange("gender", gender)} options={genderOptions} placeholder="Vyberte pohlaví" disabled={disabled} />
                        )}
                    </FormField>
                    <FormField {...field("dateOfBirth", "Datum narození", { required: true })}>
                        {(controlProps) => (
                            <DatePicker {...controlProps} minDate={OLDEST_BIRTH_DATE} maxDate={todayIsoDate()} disabled={disabled} value={values.dateOfBirth} onChange={(date) => onChange("dateOfBirth", date)} />
                        )}
                    </FormField>
                    <FormField {...field("personalNumber", "Osobní číslo", { hint: "Číslo klienta v evidenci organizace." })}>
                        {(controlProps) => (
                            <Input {...controlProps} inputMode="numeric" className="tabular-nums" disabled={disabled} value={values.personalNumber} onChange={(event) => onChange("personalNumber", event.target.value.replace(/\D/g, ""))} />
                        )}
                    </FormField>
                    <div className="flex items-center gap-3 sm:pt-7">
                        <Checkbox id={`${idPrefix}-legally-competent`} checked={values.legallyCompetent} onCheckedChange={(checked) => onChange("legallyCompetent", checked === true)} disabled={disabled} />
                        <Label htmlFor={`${idPrefix}-legally-competent`}>Svéprávný</Label>
                    </div>
                </div>
            </FieldSection>

            <FieldSection title="Péče">
                <div className="grid items-start gap-4 sm:grid-cols-2">
                    <FormField {...field("departmentId", "Středisko", { required: true })}>
                        {(controlProps) => (
                            <Select value={values.departmentId ? String(values.departmentId) : ""} onValueChange={(id) => changeDepartment(Number(id))} disabled={disabled}>
                                <SelectTrigger {...controlProps} className="w-full"><SelectValue placeholder="Vyberte středisko" /></SelectTrigger>
                                <SelectContent>
                                    {departments.map((department) => <SelectItem key={department.id} value={String(department.id)}>{department.city}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    </FormField>
                    <FormField {...field("caregiverId", "Klíčový pracovník", { required: true })}>
                        {(controlProps) => (
                            <Combobox
                                {...controlProps}
                                options={caregiverOptions}
                                value={values.caregiverId}
                                onChange={(caregiverId) => onChange("caregiverId", caregiverId)}
                                placeholder={values.departmentId ? "Vyberte pracovníka" : "Nejdřív vyberte středisko"}
                                searchPlaceholder="Hledat pracovníka…"
                                disabled={disabled || !values.departmentId}
                            />
                        )}
                    </FormField>
                    <FormField {...field("benefits", "Příspěvek na péči")}>
                        {(controlProps) => (
                            <OptionSelect controlProps={controlProps} value={values.benefits} onChange={(benefits) => onChange("benefits", benefits)} options={benefitsOptions} disabled={disabled} />
                        )}
                    </FormField>
                    <FormField {...field("taskIds", "Úkony", { hint: "Úkony z plánu se nabízejí jako první při zápisu péče." })}>
                        {(controlProps) => (
                            <MultiCombobox
                                {...controlProps}
                                options={taskOptions}
                                value={values.taskIds}
                                onChange={(taskIds) => onChange("taskIds", taskIds)}
                                formatCount={(count) => `${count} ${pluralize(count, ["úkon", "úkony", "úkonů"])}`}
                                placeholder="Vyberte úkony"
                                searchPlaceholder="Hledat úkon…"
                                disabled={disabled}
                            />
                        )}
                    </FormField>
                </div>
            </FieldSection>

            <FieldSection title="Adresa a kontakt" description="Z adresy se dohledá poloha klienta na mapě.">
                <FormField {...field("street", "Ulice a číslo popisné", { required: true })}>
                    {(controlProps) => <Input {...controlProps} autoComplete="off" disabled={disabled} value={values.street} onChange={update("street")} />}
                </FormField>
                <div className="grid grid-cols-3 items-start gap-4">
                    <FormField {...field("city", "Město", { required: true, className: "col-span-2" })}>
                        {(controlProps) => <Input {...controlProps} autoComplete="off" disabled={disabled} value={values.city} onChange={update("city")} />}
                    </FormField>
                    <FormField {...field("postalCode", "PSČ", { required: true })}>
                        {(controlProps) => (
                            <Input {...controlProps} inputMode="numeric" className="tabular-nums" disabled={disabled} value={values.postalCode} onChange={(event) => onChange("postalCode", formatPostalCode(event.target.value))} />
                        )}
                    </FormField>
                </div>
                <div className="grid items-start gap-4 sm:grid-cols-2">
                    <FormField {...field("phone", "Telefon")}>
                        {(controlProps) => (
                            <Input {...controlProps} type="tel" className="tabular-nums" disabled={disabled} value={values.phone} onChange={(event) => onChange("phone", formatPhoneNumber(event.target.value))} />
                        )}
                    </FormField>
                    <FormField {...field("email", "E-mail")}>
                        {(controlProps) => <Input {...controlProps} type="email" autoComplete="off" disabled={disabled} value={values.email} onChange={update("email")} />}
                    </FormField>
                </div>
                <FormField {...field("relativesContact", "Kontakt na příbuzné")}>
                    {(controlProps) => <Textarea {...controlProps} rows={2} disabled={disabled} value={values.relativesContact} onChange={update("relativesContact")} />}
                </FormField>
                <FormField {...field("generalPractitioner", "Praktický lékař")}>
                    {(controlProps) => <Textarea {...controlProps} rows={2} disabled={disabled} value={values.generalPractitioner} onChange={update("generalPractitioner")} />}
                </FormField>
            </FieldSection>

            <FieldSection title="Poznámky">
                <FormField {...field("notes", "Poznámky")}>
                    {(controlProps) => <Textarea {...controlProps} rows={3} disabled={disabled} value={values.notes} onChange={update("notes")} />}
                </FormField>
            </FieldSection>

            {withTermination && (
                <FieldSection title="Ukončení smlouvy">
                    <div className="grid items-start gap-4 sm:grid-cols-2">
                        <FormField {...field("terminationDate", "Datum ukončení", { required: true })}>
                            {(controlProps) => (
                                <DatePicker {...controlProps} maxDate={todayIsoDate()} disabled={disabled} value={values.terminationDate} onChange={(date) => onChange("terminationDate", date)} />
                            )}
                        </FormField>
                        <FormField {...field("terminationReason", "Důvod", { required: true })}>
                            {(controlProps) => (
                                <OptionSelect controlProps={controlProps} value={values.terminationReason} onChange={(reason) => onChange("terminationReason", reason)} options={terminationReasonOptions} placeholder="Vyberte důvod" disabled={disabled} />
                            )}
                        </FormField>
                    </div>
                </FieldSection>
            )}
        </div>
    );
}
