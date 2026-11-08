import { FormField } from "@/components/FormField";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UNIT_TYPES } from "./taskForm";

export function TaskFields({ idPrefix, values, errors, onChange, disabled, shakeSignal }) {
    const priceSuffix = UNIT_TYPES.find((type) => type.value === values.unitType)?.priceSuffix;

    return (
        <div className="grid gap-4">
            <FormField id={`${idPrefix}-name`} label="Název" required error={errors.name} shakeSignal={shakeSignal}>
                {(controlProps) => <Input {...controlProps} autoFocus disabled={disabled} value={values.name} onChange={(event) => onChange("name", event.target.value)} />}
            </FormField>
            <div className="grid grid-cols-2 items-start gap-3">
                <FormField id={`${idPrefix}-unit`} label="Jednotka" required>
                    {(controlProps) => (
                        <Select value={values.unitType} onValueChange={(unitType) => onChange("unitType", unitType)} disabled={disabled}>
                            <SelectTrigger {...controlProps} className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {UNIT_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                </FormField>
                <FormField id={`${idPrefix}-price`} label="Cena" required error={errors.unitPrice} shakeSignal={shakeSignal}>
                    {(controlProps) => (
                        <div className="relative">
                            <Input {...controlProps} inputMode="numeric" className="pr-20 tabular-nums" disabled={disabled} value={values.unitPrice}
                                onChange={(event) => onChange("unitPrice", event.target.value.replace(/\D/g, ""))} />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">{priceSuffix}</span>
                        </div>
                    )}
                </FormField>
            </div>
            <div className="flex items-start gap-3">
                <Checkbox
                    id={`${idPrefix}-double`}
                    checked={values.doubleMeeting}
                    onCheckedChange={(checked) => onChange("doubleMeeting", checked === true)}
                    disabled={disabled}
                    className="mt-0.5"
                />
                <div className="grid gap-0.5">
                    <Label htmlFor={`${idPrefix}-double`}>Dvojité setkání</Label>
                    <p className="text-sm text-muted-foreground">Jeden zapsaný úkon se do počtu setkání s klientem započítá dvakrát.</p>
                </div>
            </div>
        </div>
    );
}
