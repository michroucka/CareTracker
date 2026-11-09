export const EMPTY_DEPARTMENT = { street: "", city: "", postalCode: "", departmentNumber: "", coordinatorId: null };

export function toFormValues(department) {
    return {
        street: department?.street ?? "",
        city: department?.city ?? "",
        postalCode: department?.postalCode ?? "",
        departmentNumber: department?.departmentNumber != null ? String(department.departmentNumber) : "",
        coordinatorId: department?.coordinator?.id ?? null,
    };
}

export function validateDepartment(values) {
    const errors = {};
    if (!values.street.trim()) errors.street = "Prosím zadejte ulici";
    if (!values.city.trim()) errors.city = "Prosím zadejte město";
    if (values.postalCode && values.postalCode.replace(/\D/g, "").length !== 5) errors.postalCode = "PSČ má 5 číslic";
    return errors;
}

export function toRequest(values, organizationId) {
    return {
        street: values.street.trim(),
        city: values.city.trim(),
        postalCode: values.postalCode || null,
        departmentNumber: values.departmentNumber ? Number(values.departmentNumber) : null,
        coordinatorId: values.coordinatorId,
        organizationId: organizationId ?? null,
    };
}

/** Employees who can coordinate: anyone who does not coordinate another department yet. */
export function coordinatorOptions(employees, currentCoordinatorId) {
    return employees
        .filter((employee) => employee.role !== "COORDINATOR" || employee.id === currentCoordinatorId)
        .map((employee) => ({
            value: employee.id,
            label: `${employee.firstName} ${employee.lastName}`,
            description: employee.department?.city,
        }));
}

export function formatAddress(department) {
    const cityLine = [department.postalCode, department.city].filter(Boolean).join(" ");
    return [department.street, cityLine].filter(Boolean).join(", ");
}
