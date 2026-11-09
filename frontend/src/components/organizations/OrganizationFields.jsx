import { Combobox } from "@/components/Combobox";
import { FormField } from "@/components/FormField";
import { Input } from "@/components/ui/input";

/**
 * Organization form fields. `managerOptions` = [{ value, label }]; without it the manager field is hidden
 * (a new organization has no employees yet).
 */
export function OrganizationFields({ idPrefix, values, errors, onChange, disabled, shakeSignal, managerOptions }) {
    const update = (field) => (event) => onChange(field, event.target.value);
    const digitsOnly = (field) => (event) => onChange(field, event.target.value.replace(/\D/g, ""));

    return (
        <div className="grid gap-4">
            <FormField id={`${idPrefix}-name`} label="Název" required error={errors.name} shakeSignal={shakeSignal}>
                {(controlProps) => <Input {...controlProps} autoFocus disabled={disabled} value={values.name} onChange={update("name")} />}
            </FormField>

            {managerOptions && (
                <FormField id={`${idPrefix}-manager`} label="Vedoucí" hint="Vedoucí dostane v aplikaci roli administrátora. Dosavadní vedoucí se vrátí na koordinátora nebo pečovatele.">
                    {(controlProps) => (
                        <Combobox
                            {...controlProps}
                            options={managerOptions}
                            value={values.managerId}
                            onChange={(managerId) => onChange("managerId", managerId)}
                            placeholder="Bez vedoucího"
                            searchPlaceholder="Hledat zaměstnance…"
                            emptyText="Žádný zaměstnanec nenalezen."
                            clearLabel="Bez vedoucího"
                            disabled={disabled}
                        />
                    )}
                </FormField>
            )}

            <fieldset className="grid gap-1.5">
                <legend className="mb-1.5 text-sm">Bankovní účet</legend>
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,4fr)_minmax(0,2fr)] items-start gap-2">
                    <FormField id={`${idPrefix}-account-prefix`} label="Předčíslí" error={errors.accountPrefix} shakeSignal={shakeSignal}>
                        {(controlProps) => <Input {...controlProps} inputMode="numeric" maxLength={6} disabled={disabled} value={values.accountPrefix} onChange={digitsOnly("accountPrefix")} />}
                    </FormField>
                    <FormField id={`${idPrefix}-account-number`} label="Číslo účtu" error={errors.accountNumber} shakeSignal={shakeSignal}>
                        {(controlProps) => <Input {...controlProps} inputMode="numeric" maxLength={10} disabled={disabled} value={values.accountNumber} onChange={digitsOnly("accountNumber")} />}
                    </FormField>
                    <FormField id={`${idPrefix}-bank-code`} label="Kód banky" error={errors.bankCode} shakeSignal={shakeSignal}>
                        {(controlProps) => <Input {...controlProps} inputMode="numeric" maxLength={4} disabled={disabled} value={values.bankCode} onChange={digitsOnly("bankCode")} />}
                    </FormField>
                </div>
                <p className="text-sm text-muted-foreground">Z účtu se generuje QR kód pro platbu ve vyúčtování klienta.</p>
            </fieldset>
        </div>
    );
}
