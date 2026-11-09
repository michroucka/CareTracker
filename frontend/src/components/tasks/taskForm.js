export const UNIT_TYPES = [
    { value: "HOUR", label: "Hodina", priceSuffix: "Kč / hod" },
    { value: "OCCURRENCE", label: "Úkon", priceSuffix: "Kč / úkon" },
    { value: "KM", label: "Kilometr", priceSuffix: "Kč / km" },
    { value: "KG", label: "Kilogram", priceSuffix: "Kč / kg" },
];

export const unitTypeLabel = (unitType) => UNIT_TYPES.find((type) => type.value === unitType)?.label ?? unitType;

/** "120 Kč / hod" */
export function formatTaskPrice(task) {
    const suffix = UNIT_TYPES.find((type) => type.value === task.unitType)?.priceSuffix ?? "Kč";
    return `${new Intl.NumberFormat("cs-CZ").format(task.unitPrice)} ${suffix}`;
}

export const EMPTY_TASK = { name: "", unitType: "HOUR", unitPrice: "", doubleMeeting: false };

export function toFormValues(task) {
    return {
        name: task?.name ?? "",
        unitType: task?.unitType ?? "HOUR",
        unitPrice: task?.unitPrice != null ? String(task.unitPrice) : "",
        doubleMeeting: task?.doubleMeeting ?? false,
    };
}

export function validateTask(values) {
    const errors = {};
    if (!values.name.trim()) errors.name = "Prosím zadejte název";
    if (!values.unitPrice) errors.unitPrice = "Prosím zadejte cenu";
    else if (Number(values.unitPrice) <= 0) errors.unitPrice = "Cena musí být větší než 0";
    return errors;
}

export function toRequest(values, organizationId) {
    return {
        name: values.name.trim(),
        unitType: values.unitType,
        unitPrice: Number(values.unitPrice),
        doubleMeeting: values.doubleMeeting,
        organizationId: organizationId ?? null,
    };
}
