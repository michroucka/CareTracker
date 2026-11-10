import { calculatePrice } from "@/constants/performedTaskConstants";
import { MIN_YEAR } from "@/constants/globalConstants";
import { todayIsoDate } from "@/lib/dates";
import { formatDuration } from "@/components/dashboard/dashboardFormat";
import { formatNumber } from "@/utils/formatters";
import { ROLES } from "@/constants/roles";

export const MIN_DATE = `${MIN_YEAR}-01-01`;

const UNIT_LABELS = { HOUR: "min", OCCURRENCE: "×", KM: "km", KG: "kg" };
const DECIMAL_UNITS = ["KM", "KG"];

/** Summary DTOs carry `fullName`, list DTOs first and last name. */
export const personName = (person) => person.fullName ?? `${person.firstName} ${person.lastName}`;

/** The record's task with the price per unit stored with the record, which can differ from today's catalog price. */
export const recordedTask = (performedTask) => ({ ...performedTask.task, unitPrice: performedTask.unitPrice });

export const toPersonOptions = (people) => people.map((person) => ({ value: person.id, label: personName(person) }));

/** Adds the record's own client / caregivers when they are no longer in the active lists. */
export function withMissing(list, records = []) {
    const missing = records.filter((record) => record && !list.some((item) => item.id === record.id));
    return missing.length ? [...list, ...missing] : list;
}

export const allowsDecimals =(unitType) => DECIMAL_UNITS.includes(unitType);

export function amountLabel(unitType) {
    if (unitType === "HOUR") return "Délka (min)";
    if (unitType === "OCCURRENCE") return "Počet";
    return `Množství (${UNIT_LABELS[unitType]})`;
}

/** 90 min → "1 h 30 min", 2 úkony → "2×", 3.5 kg → "3,5 kg" */
export function formatAmount(unitCount, unitType) {
    if (unitCount == null) return "–";
    if (unitType === "HOUR") return formatDuration(unitCount);
    if (unitType === "OCCURRENCE") return `${formatNumber(unitCount)}×`;
    return `${formatNumber(unitCount)} ${UNIT_LABELS[unitType] ?? ""}`;
}

export const TIME_STEP = 5;

/** Current time rounded down to the time picker's step, so a new record never starts in the future. */
function currentTime() {
    const now = new Date();
    const minutes = Math.floor(now.getMinutes() / TIME_STEP) * TIME_STEP;
    return `${String(now.getHours()).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function emptyPerformedTask(caregiverId) {
    return {
        clientId: null,
        taskId: null,
        date: todayIsoDate(),
        time: currentTime(),
        unitCount: "",
        caregiverIds: caregiverId ? [caregiverId] : [],
        notes: "",
    };
}

export function toFormValues(performedTask) {
    const [date = "", time = ""] = performedTask?.date?.split("T") ?? [];
    return {
        clientId: performedTask?.client?.id ?? null,
        taskId: performedTask?.task?.id ?? null,
        date,
        time: time.slice(0, 5),
        unitCount: performedTask?.unitCount != null ? formatNumber(performedTask.unitCount, { useGrouping: false }) : "",
        caregiverIds: performedTask?.caregivers?.map((caregiver) => caregiver.id) ?? [],
        notes: performedTask?.notes ?? "",
    };
}

export const parseAmount = (text) => Number(String(text).replace(",", "."));

export function previewPrice(task, unitCount) {
    const amount = parseAmount(unitCount);
    return task && amount > 0 ? calculatePrice(task, amount) : null;
}

/**
 * `ownCaregiverId` is the signed-in caregiver, who must stay among the caregivers of their record
 * (the server rejects it otherwise, and the caregiver could not edit the record afterwards).
 */
export function validatePerformedTask(values, task, ownCaregiverId) {
    const errors = {};
    if (!values.clientId) errors.clientId = "Prosím vyberte klienta";
    if (!values.taskId) errors.taskId = "Prosím vyberte úkon";
    if (!values.date) errors.date = "Prosím zadejte datum";
    if (!values.time) errors.time = "Prosím zadejte čas";
    else if (new Date(`${values.date}T${values.time}`) > new Date()) errors.time = "Úkon nemůže být v budoucnosti";

    const amount = parseAmount(values.unitCount);
    if (!values.unitCount) errors.unitCount = "Prosím zadejte množství";
    else if (!(amount > 0)) errors.unitCount = "Zadejte kladné číslo";
    else if (task && !allowsDecimals(task.unitType) && !Number.isInteger(amount)) errors.unitCount = "Zadejte celé číslo";

    if (values.caregiverIds.length === 0) errors.caregiverIds = "Prosím vyberte pečovatele";
    else if (ownCaregiverId && !values.caregiverIds.includes(ownCaregiverId)) errors.caregiverIds = "Mezi pečovateli musíte být i vy";
    return errors;
}

/** Employee id the signed-in user must keep among the caregivers: only caregivers record just their own work. */
export function requiredCaregiverId(user) {
    return user.role === ROLES.CAREGIVER ? user.employeeId : null;
}

export function toRequest(values) {
    return {
        clientId: values.clientId,
        taskId: values.taskId,
        date: `${values.date}T${values.time}:00`,
        unitCount: parseAmount(values.unitCount),
        caregiverIds: values.caregiverIds,
        notes: values.notes.trim() || null,
    };
}
