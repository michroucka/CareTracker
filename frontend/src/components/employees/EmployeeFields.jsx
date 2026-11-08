import { FormField } from "@/components/FormField";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function CheckboxRow({ id, checked, onChange, disabled, label, hint }) {
    return (
        <div className="flex items-start gap-3">
            <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} disabled={disabled} className="mt-0.5" />
            <div className="grid gap-0.5">
                <Label htmlFor={id}>{label}</Label>
                {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
            </div>
        </div>
    );
}

/**
 * Employee form fields. `hasAccount` hides the "create account" switch for employees who already have one;
 * `canManageAdmins` allows the administrator flag.
 */
export function EmployeeFields({ idPrefix, values, errors, onChange, disabled, shakeSignal, roles, departments, hasAccount, canManageAdmins }) {
    const update = (field) => (event) => onChange(field, event.target.value);

    return (
        <div className="grid gap-4">
            <div className="grid grid-cols-2 items-start gap-3">
                <FormField id={`${idPrefix}-first-name`} label="Jméno" required error={errors.firstName} shakeSignal={shakeSignal}>
                    {(controlProps) => <Input {...controlProps} autoFocus autoComplete="given-name" disabled={disabled} value={values.firstName} onChange={update("firstName")} />}
                </FormField>
                <FormField id={`${idPrefix}-last-name`} label="Příjmení" required error={errors.lastName} shakeSignal={shakeSignal}>
                    {(controlProps) => <Input {...controlProps} autoComplete="family-name" disabled={disabled} value={values.lastName} onChange={update("lastName")} />}
                </FormField>
            </div>
            <div className="grid grid-cols-2 items-start gap-3">
                <FormField id={`${idPrefix}-role`} label="Role" required>
                    {(controlProps) => (
                        <Select value={values.role} onValueChange={(role) => onChange("role", role)} disabled={disabled}>
                            <SelectTrigger {...controlProps} className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                </FormField>
                <FormField id={`${idPrefix}-department`} label="Středisko" required error={errors.departmentId} shakeSignal={shakeSignal}>
                    {(controlProps) => (
                        <Select value={values.departmentId ? String(values.departmentId) : ""} onValueChange={(id) => onChange("departmentId", Number(id))} disabled={disabled}>
                            <SelectTrigger {...controlProps} className="w-full"><SelectValue placeholder="Vyberte středisko" /></SelectTrigger>
                            <SelectContent>
                                {departments.map((department) => <SelectItem key={department.id} value={String(department.id)}>{department.city}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                </FormField>
            </div>

            <fieldset className="grid gap-4 rounded-lg border p-4">
                <legend className="px-1 text-sm font-medium">Uživatelský účet</legend>
                {!hasAccount && (
                    <CheckboxRow
                        id={`${idPrefix}-create-account`}
                        checked={values.createAccount}
                        onChange={(checked) => onChange("createAccount", checked)}
                        disabled={disabled}
                        label="Vytvořit účet v aplikaci"
                        hint="Na e-mail přijde odkaz pro aktivaci účtu."
                    />
                )}
                {values.createAccount && (
                    <>
                        <FormField id={`${idPrefix}-email`} label="E-mail" required error={errors.email} shakeSignal={shakeSignal}>
                            {(controlProps) => <Input {...controlProps} type="email" autoComplete="email" disabled={disabled} value={values.email} onChange={update("email")} />}
                        </FormField>
                        <CheckboxRow
                            id={`${idPrefix}-admin`}
                            checked={values.isAdmin}
                            onChange={(checked) => onChange("isAdmin", checked)}
                            disabled={disabled || !canManageAdmins}
                            label="Administrátor"
                            hint={canManageAdmins ? "Spravuje celou organizaci: střediska, zaměstnance, úkony." : "Administrátora může přidělit jen administrátor."}
                        />
                    </>
                )}
            </fieldset>
        </div>
    );
}
