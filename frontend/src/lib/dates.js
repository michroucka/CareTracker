/** "2026-11-08" → local Date (no time zone shift) */
export function fromIsoDate(iso) {
    if (!iso) return undefined;
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day);
}

/** local Date → "2026-11-08" */
export function toIsoDate(date) {
    return date ? date.toLocaleDateString("sv-SE") : "";
}

export const todayIsoDate = () => toIsoDate(new Date());

export const padTime = (number) => String(number).padStart(2, "0");

/** "14:30", "14.30", "1430", "930", "9" → "14:30" / "09:30" / "09:00"; null when it is not a valid time. */
export function parseTime(text) {
    const trimmed = text.trim();
    const separated = trimmed.match(/^(\d{1,2})[:.,](\d{1,2})$/);
    const digits = trimmed.match(/^\d{1,4}$/) && trimmed;
    let hours;
    let minutes;
    if (separated) {
        hours = Number(separated[1]);
        minutes = Number(separated[2]);
    } else if (digits) {
        hours = Number(digits.length <= 2 ? digits : digits.slice(0, -2));
        minutes = digits.length <= 2 ? 0 : Number(digits.slice(-2));
    } else {
        return null;
    }
    return hours < 24 && minutes < 60 ? `${padTime(hours)}:${padTime(minutes)}` : null;
}
