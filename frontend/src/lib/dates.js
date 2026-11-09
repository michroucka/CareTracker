/** "2026-11-08" → local Date (no time zone shift) */
export function fromIsoDate(iso) {
    if (!iso) return undefined;
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day);
}

/**
 * A date the backend sends as "YYYY-MM-DD" (LocalDate) is a calendar day; new Date() would read it as UTC
 * midnight, which is the previous day west of UTC. Other strings and Date objects are read as they are.
 */
export function toLocalDate(value) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return fromIsoDate(value);
    return new Date(value);
}

/** The same day of the month `months` later, or the last day of a shorter month (31 Aug + 6 → 28 Feb). */
export function addMonths(date, months) {
    const firstOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const lastDayOfTargetMonth = new Date(firstOfTargetMonth.getFullYear(), firstOfTargetMonth.getMonth() + 1, 0).getDate();
    firstOfTargetMonth.setDate(Math.min(date.getDate(), lastDayOfTargetMonth));
    return firstOfTargetMonth;
}

/** local Date → "2026-11-08" */
export function toIsoDate(date) {
    return date ? date.toLocaleDateString("sv-SE") : "";
}

export const todayIsoDate = () => toIsoDate(new Date());
