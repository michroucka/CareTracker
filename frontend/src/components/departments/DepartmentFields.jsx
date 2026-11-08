import { Combobox } from "@/components/Combobox";
import { FormField } from "@/components/FormField";
import { Input } from "@/components/ui/input";
import { formatPostalCode } from "@/utils/formatters";

export function DepartmentFields({ idPrefix, values, errors, onChange, disabled, shakeSignal, coordinatorOptions }) {
    const update = (field) => (event) => onChange(field, event.target.value);

    return (
        <div className="grid gap-4">
            <FormField id={`${idPrefix}-street`} label="Ulice a číslo popisné" required error={errors.street} shakeSignal={shakeSignal}>
                {(controlProps) => <Input {...controlProps} autoFocus autoComplete="street-address" disabled={disabled} value={values.street} onChange={update("street")} />}
            </FormField>
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-3">
                <FormField id={`${idPrefix}-city`} label="Město" required error={errors.city} shakeSignal={shakeSignal}>
                    {(controlProps) => <Input {...controlProps} autoComplete="address-level2" disabled={disabled} value={values.city} onChange={update("city")} />}
                </FormField>
                <FormField id={`${idPrefix}-postal-code`} label="PSČ" error={errors.postalCode} shakeSignal={shakeSignal}>
                    {(controlProps) => (
                        <Input {...controlProps} inputMode="numeric" autoComplete="postal-code" disabled={disabled} value={values.postalCode}
                            onChange={(event) => onChange("postalCode", formatPostalCode(event.target.value))} />
                    )}
                </FormField>
            </div>
            <FormField id={`${idPrefix}-number`} label="Číslo střediska" hint="Interní číslo, nepovinné.">
                {(controlProps) => (
                    <Input {...controlProps} inputMode="numeric" className="max-w-32" disabled={disabled} value={values.departmentNumber}
                        onChange={(event) => onChange("departmentNumber", event.target.value.replace(/\D/g, ""))} />
                )}
            </FormField>
            <FormField id={`${idPrefix}-coordinator`} label="Koordinátor" hint="Koordinátor spravuje klienty a pečovatele střediska.">
                {(controlProps) => (
                    <Combobox
                        {...controlProps}
                        options={coordinatorOptions}
                        value={values.coordinatorId}
                        onChange={(coordinatorId) => onChange("coordinatorId", coordinatorId)}
                        placeholder="Bez koordinátora"
                        searchPlaceholder="Hledat zaměstnance…"
                        emptyText="Žádný dostupný zaměstnanec."
                        clearLabel="Bez koordinátora"
                        disabled={disabled}
                    />
                )}
            </FormField>
        </div>
    );
}
