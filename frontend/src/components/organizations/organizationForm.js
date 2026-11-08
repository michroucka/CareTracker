const DIGITS = /^\d+$/;

export const EMPTY_ORGANIZATION = { name: "", managerId: null, accountPrefix: "", accountNumber: "", bankCode: "" };

export function toFormValues(organization) {
    return {
        name: organization?.name ?? "",
        managerId: organization?.manager?.id ?? null,
        accountPrefix: organization?.accountPrefix ?? "",
        accountNumber: organization?.accountNumber ?? "",
        bankCode: organization?.bankCode ?? "",
    };
}

/** Czech bank account: optional prefix (max 6 digits), number (2–10 digits) and bank code (4 digits). */
export function validateOrganization(values) {
    const errors = {};
    if (!values.name.trim()) errors.name = "Prosím zadejte název";

    const hasAccount = values.accountPrefix || values.accountNumber || values.bankCode;
    if (hasAccount) {
        if (values.accountPrefix && !(DIGITS.test(values.accountPrefix) && values.accountPrefix.length <= 6)) {
            errors.accountPrefix = "Předčíslí má nejvýše 6 číslic";
        }
        if (!DIGITS.test(values.accountNumber) || values.accountNumber.length < 2 || values.accountNumber.length > 10) {
            errors.accountNumber = "Číslo účtu má 2 až 10 číslic";
        }
        if (!DIGITS.test(values.bankCode) || values.bankCode.length !== 4) {
            errors.bankCode = "Kód banky má 4 číslice";
        }
    }
    return errors;
}

export function toRequest(values) {
    const optional = (value) => value.trim() || null;
    return {
        name: values.name.trim(),
        managerId: values.managerId,
        accountPrefix: optional(values.accountPrefix),
        accountNumber: optional(values.accountNumber),
        bankCode: optional(values.bankCode),
    };
}

/** "19-2000145399/0800" or null */
export function formatBankAccount(organization) {
    if (!organization?.accountNumber || !organization?.bankCode) return null;
    const prefix = organization.accountPrefix ? `${organization.accountPrefix}-` : "";
    return `${prefix}${organization.accountNumber}/${organization.bankCode}`;
}
