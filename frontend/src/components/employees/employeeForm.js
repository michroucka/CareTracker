import { ROLE_LABELS } from "@/constants/roles";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMIN_ONLY_ROLES = ["COORDINATOR", "MANAGER"];

/** Roles the current user may assign; the employee's current role always stays available. */
export function roleOptions(canManageAdmins, currentRole) {
    return ["CAREGIVER", ...ADMIN_ONLY_ROLES]
        .filter((role) => role === "CAREGIVER" || canManageAdmins || role === currentRole)
        .map((role) => ({ value: role, label: ROLE_LABELS[role] }));
}

export function emptyEmployee(defaultDepartmentId) {
    return { firstName: "", lastName: "", role: "CAREGIVER", departmentId: defaultDepartmentId ?? null, createAccount: true, email: "", isAdmin: false };
}

export function toFormValues(employee) {
    return {
        firstName: employee?.firstName ?? "",
        lastName: employee?.lastName ?? "",
        role: employee?.role ?? "CAREGIVER",
        departmentId: employee?.department?.id ?? null,
        createAccount: Boolean(employee?.email),
        email: employee?.email ?? "",
        isAdmin: employee?.isAdmin ?? false,
    };
}

export function validateEmployee(values) {
    const errors = {};
    if (!values.firstName.trim()) errors.firstName = "Prosím zadejte jméno";
    if (!values.lastName.trim()) errors.lastName = "Prosím zadejte příjmení";
    if (!values.departmentId) errors.departmentId = "Prosím vyberte středisko";
    if (values.createAccount) {
        if (!values.email.trim()) errors.email = "Prosím zadejte e-mail";
        else if (!EMAIL.test(values.email.trim())) errors.email = "Zadejte platnou e-mailovou adresu";
    }
    return errors;
}

export function toRequest(values) {
    const request = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        role: values.role,
        departmentId: values.departmentId,
    };
    if (values.createAccount) {
        request.email = values.email.trim();
        request.isAdmin = values.isAdmin;
    }
    return request;
}

/** User account state of an employee for badges. */
export function accountState(employee) {
    if (!employee.email) return { variant: "outline", label: "Bez účtu" };
    if (!employee.isActivated) return { variant: "pending", label: "Čeká na aktivaci" };
    return { variant: "success", label: "Aktivní účet" };
}
