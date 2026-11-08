const currencyFormatter = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat("cs-CZ");
const longDateFormatter = new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long" });
const shortDateFormatter = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit" });
const DAY_MS = 24 * 60 * 60 * 1000;

export const formatCurrency = (value) => currencyFormatter.format(value ?? 0);
export const formatCount = (value) => numberFormatter.format(value ?? 0);
export const formatLongDate = (date) => longDateFormatter.format(date);

/** Czech plural: forms = ["den", "dny", "dní"] for 1, 2–4 and 0/5+. */
export function pluralize(count, [one, few, many]) {
    const absolute = Math.abs(count);
    if (absolute === 1) return one;
    if (absolute >= 2 && absolute <= 4) return few;
    return many;
}

/** 750 → "12 h 30 min", 45 → "45 min" */
export function formatDuration(minutes = 0) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return `${rest} min`;
    return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

function startOfDay(date) {
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    return day;
}

export function daysFromToday(date) {
    return Math.round((startOfDay(date) - startOfDay(new Date())) / DAY_MS);
}

/** "Dnes 14:30", "Včera 9:05" or "5. 11." */
export function formatRecordDate(date) {
    const days = daysFromToday(date);
    if (days === 0) return `Dnes ${timeFormatter.format(new Date(date))}`;
    if (days === -1) return `Včera ${timeFormatter.format(new Date(date))}`;
    return shortDateFormatter.format(new Date(date));
}

/** "před 3 dny", "před 2 týdny", "před 4 měsíci" */
export function formatAgo(date) {
    const days = -daysFromToday(date);
    if (days < 14) return `před ${days} ${pluralize(days, ["dnem", "dny", "dny"])}`;
    if (days < 60) {
        const weeks = Math.floor(days / 7);
        return `před ${weeks} ${pluralize(weeks, ["týdnem", "týdny", "týdny"])}`;
    }
    const months = Math.floor(days / 30);
    return `před ${months} ${pluralize(months, ["měsícem", "měsíci", "měsíci"])}`;
}

export function getGreeting(date = new Date()) {
    const hour = date.getHours();
    if (hour < 10) return "Dobré ráno";
    if (hour >= 18) return "Dobrý večer";
    return "Dobrý den";
}

/** Labels for the last 12 months, oldest first, matching the backend history arrays. */
export function lastTwelveMonthLabels(monthNames) {
    const now = new Date();
    return Array.from({ length: 12 }, (_, index) => monthNames[new Date(now.getFullYear(), now.getMonth() - 11 + index, 1).getMonth()]);
}

function isWorkday(date) {
    const weekday = date.getDay();
    return weekday !== 0 && weekday !== 6;
}

/** Working days (Mon–Fri, public holidays not considered) in the current month: total and elapsed incl. today. */
export function monthWorkdays(now = new Date()) {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let total = 0;
    let elapsed = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        if (!isWorkday(new Date(now.getFullYear(), now.getMonth(), day))) continue;
        total++;
        if (day <= now.getDate()) elapsed++;
    }
    return { total, elapsed };
}

/**
 * Estimated value at the end of the current month from the pace so far (per working day).
 * Returns null before the first working day, when there is nothing to extrapolate from.
 */
export function projectMonthEnd(valueSoFar, now = new Date()) {
    const { total, elapsed } = monthWorkdays(now);
    if (elapsed === 0) return null;
    return Math.round((valueSoFar / elapsed) * total);
}

/** 265 400 → "265 tis.", 1 234 567 → "1,2 mil." – for compact estimates */
export function formatCompact(value) {
    return new Intl.NumberFormat("cs-CZ", { notation: "compact", maximumSignificantDigits: 3 }).format(value);
}

const MONTHS_DATIVE = ["lednu", "únoru", "březnu", "dubnu", "květnu", "červnu", "červenci", "srpnu", "září", "říjnu", "listopadu", "prosinci"];

/** "říjnu" in November – for "proti říjnu" */
export function previousMonthDative(now = new Date()) {
    return MONTHS_DATIVE[new Date(now.getFullYear(), now.getMonth() - 1, 1).getMonth()];
}

/** Month-end estimate compared with the whole previous month, null when there is nothing to compare. */
export function projectedChange(projected, previousMonthValue) {
    if (projected == null || !previousMonthValue) return null;
    return projected / previousMonthValue - 1;
}
