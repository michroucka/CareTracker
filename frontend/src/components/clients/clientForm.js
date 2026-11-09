import { todayIsoDate } from "@/lib/dates";
import { pictureUrl } from "@/lib/pictures";
import { formatPhoneNumber, formatPostalCode } from "@/utils/formatters";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^(\+\d{3} )?\d{3} \d{3} \d{3}$/;
const POSTAL_CODE = /^\d{3} \d{2}$/;

export const OLDEST_BIRTH_DATE = "1900-01-01";

export function emptyClient(defaultDepartmentId) {
    return toFormValues({ department: defaultDepartmentId ? { id: defaultDepartmentId } : null });
}

export function toFormValues(client) {
    return {
        picture: client?.id ? pictureUrl("clients", client.id, client.pictureId, "full") : null,
        firstName: client?.firstName ?? "",
        lastName: client?.lastName ?? "",
        gender: client?.gender ?? "",
        dateOfBirth: client?.dateOfBirth ?? "",
        personalNumber: client?.personalNumber != null ? String(client.personalNumber) : "",
        departmentId: client?.department?.id ?? null,
        caregiverId: client?.caregiver?.id ?? null,
        street: client?.street ?? "",
        city: client?.city ?? "",
        postalCode: formatPostalCode(client?.postalCode ?? ""),
        email: client?.email ?? "",
        phone: formatPhoneNumber(client?.phone ?? ""),
        legallyCompetent: client?.legallyCompetent ?? true,
        benefits: client?.benefits ?? "NONE",
        taskIds: client?.tasks?.map((task) => task.id) ?? [],
        relativesContact: client?.relativesContact ?? "",
        generalPractitioner: client?.generalPractitioner ?? "",
        notes: client?.notes ?? "",
        terminationDate: client?.terminationDate ?? "",
        terminationReason: client?.terminationReason ?? "",
    };
}

/** `withTermination` requires the contract end fields (inactive clients). */
export function validateClient(values, { withTermination = false } = {}) {
    const errors = {};
    if (!values.firstName.trim()) errors.firstName = "Prosím zadejte jméno";
    if (!values.lastName.trim()) errors.lastName = "Prosím zadejte příjmení";
    if (!values.gender) errors.gender = "Prosím vyberte pohlaví";
    if (!values.dateOfBirth) errors.dateOfBirth = "Prosím zadejte datum narození";
    if (!values.departmentId) errors.departmentId = "Prosím vyberte středisko";
    if (!values.caregiverId) errors.caregiverId = "Prosím vyberte klíčového pracovníka";
    if (!values.street.trim()) errors.street = "Prosím zadejte ulici a číslo popisné";
    if (!values.city.trim()) errors.city = "Prosím zadejte město";
    if (!values.postalCode) errors.postalCode = "Prosím zadejte PSČ";
    else if (!POSTAL_CODE.test(values.postalCode)) errors.postalCode = "PSČ ve tvaru 123 45";
    if (values.email.trim() && !EMAIL.test(values.email.trim())) errors.email = "Zadejte platnou e-mailovou adresu";
    if (values.phone && !PHONE.test(values.phone)) errors.phone = "Telefon ve tvaru 123 456 789 nebo +420 123 456 789";
    if (values.personalNumber && !/^\d+$/.test(values.personalNumber)) errors.personalNumber = "Osobní číslo může obsahovat jen číslice";
    // the number goes into the 10-digit payment variable symbol after year and month
    else if (values.personalNumber && (Number(values.personalNumber) < 1 || values.personalNumber.length > 6)) errors.personalNumber = "Osobní číslo musí být mezi 1 a 999999";
    if (withTermination) {
        if (!values.terminationDate) errors.terminationDate = "Prosím zadejte datum ukončení";
        else if (values.terminationDate > todayIsoDate()) errors.terminationDate = "Datum ukončení nemůže být v budoucnosti";
        if (!values.terminationReason) errors.terminationReason = "Prosím vyberte důvod";
    }
    return errors;
}

const orNull = (text) => text.trim() || null;

export function toRequest(values) {
    return {
        picture: values.picture,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        gender: values.gender,
        dateOfBirth: values.dateOfBirth,
        personalNumber: values.personalNumber ? Number(values.personalNumber) : null,
        departmentId: values.departmentId,
        caregiverId: values.caregiverId,
        street: values.street.trim(),
        city: values.city.trim(),
        postalCode: values.postalCode,
        email: orNull(values.email),
        phone: values.phone || null,
        legallyCompetent: values.legallyCompetent,
        benefits: values.benefits,
        taskIds: values.taskIds,
        relativesContact: orNull(values.relativesContact),
        generalPractitioner: orNull(values.generalPractitioner),
        notes: orNull(values.notes),
        terminationDate: values.terminationDate || null,
        terminationReason: values.terminationReason || null,
    };
}
