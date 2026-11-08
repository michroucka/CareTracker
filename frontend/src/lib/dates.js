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
