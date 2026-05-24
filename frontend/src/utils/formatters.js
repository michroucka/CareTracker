/**
 * Formats a number using the Czech locale (e.g. thousands separator as space, decimal as comma).
 * @param {number|string|null|undefined} value
 * @param {{ minDecimals?: number, maxDecimals?: number } & Intl.NumberFormatOptions} [options]
 * @returns {string} formatted number, or empty string for null/undefined/empty input
 */
export function formatNumber(value, options = {}) {
    if (value === null || value === undefined || value === '') return '';

    const formatter = new Intl.NumberFormat('cs-CZ', {
        minimumFractionDigits: options.minDecimals ?? 0,
        maximumFractionDigits: options.maxDecimals ?? 2,
        ...options
    });

    return formatter.format(value);
}

/**
 * Formats a phone number string into a human-readable form: optionally +XXX then groups of XXX.
 * Strips all non-digit characters (except a leading +).
 * @param {string} value raw input value
 * @returns {string} formatted phone number
 */
export function formatPhoneNumber(value) {
    let cleaned = value.replace(/[^\d+]/g, '');

    // + is only valid at the start
    const hasPlus = cleaned.startsWith('+');
    cleaned = cleaned.replace(/\+/g, '');

    if (hasPlus) {
        // +XXX XXX XXX XXX — max 3 digits for country code + 9 for the local number
        const limited = cleaned.slice(0, 12);
        if (limited.length <= 3) return `+${limited}`;
        if (limited.length <= 6) return `+${limited.slice(0, 3)} ${limited.slice(3)}`;
        if (limited.length <= 9) return `+${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
        return `+${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 9)} ${limited.slice(9)}`;
    } else {
        // XXX XXX XXX — max 9 digits
        const limited = cleaned.slice(0, 9);
        if (limited.length <= 3) return limited;
        if (limited.length <= 6) return `${limited.slice(0, 3)} ${limited.slice(3)}`;
        return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
    }
}

/**
 * Formats a Czech postal code as "XXX XX" (five digits with a space after the third).
 * Strips all non-digit characters and caps input at 5 digits.
 * @param {string} value raw input value
 * @returns {string} formatted postal code
 */
export function formatPostalCode(value) {
    const cleaned = value.replace(/\D/g, '').slice(0, 5);
    if (cleaned.length <= 3) return cleaned;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
}

/**
 * Removes Czech/Slovak diacritics for accent-insensitive search comparisons.
 * @param {string} text
 * @returns {string} lowercased string without diacritical marks
 */
export function removeDiacritics(text) {
    if (!text) return '';
    return text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}

/**
 * Formats a date into the Czech locale format.
 * @param {string|Date} date ISO string or Date object
 * @returns {string} formatted date (e.g. "13. 12. 2024")
 */
export function formatDate(date) {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('cs-CZ', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
    }).format(dateObj);
}

/**
 * Formats a date and time into the Czech locale format.
 * @param {string|Date} date ISO string or Date object
 * @returns {string} formatted date and time (e.g. "13. 12. 2024 14:30")
 */
export function formatDateTime(date) {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('cs-CZ', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(dateObj);
}

/**
 * Formats only the time portion of a date into the Czech locale format.
 * @param {string|Date} date ISO string or Date object
 * @returns {string} formatted time (e.g. "14:30")
 */
export function formatTime(date) {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(dateObj);
}
