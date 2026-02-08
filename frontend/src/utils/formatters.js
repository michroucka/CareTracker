export function formatNumber(value, options = {}) {
    if (value === null || value === undefined || value === '') return '';

    const formatter = new Intl.NumberFormat('cs-CZ', {
        minimumFractionDigits: options.minDecimals ?? 0,
        maximumFractionDigits: options.maxDecimals ?? 2,
        ...options
    });

    return formatter.format(value);
}

// Formátování telefonního čísla: volitelně +XXX a pak XXX XXX XXX
export function formatPhoneNumber(value) {
    // Povolit pouze + na začátku a číslice
    let cleaned = value.replace(/[^\d+]/g, '');

    // + může být pouze na začátku
    const hasPlus = cleaned.startsWith('+');
    cleaned = cleaned.replace(/\+/g, '');

    if (hasPlus) {
        // S předčíslím: +XXX XXX XXX XXX (max 3 pro předčíslí + 9 pro číslo)
        const limited = cleaned.slice(0, 12);

        if (limited.length <= 3) {
            // Jen předčíslí
            return `+${limited}`;
        } else if (limited.length <= 6) {
            // Předčíslí + první část
            return `+${limited.slice(0, 3)} ${limited.slice(3)}`;
        } else if (limited.length <= 9) {
            // Předčíslí + první 2 části
            return `+${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
        } else {
            // Plné číslo s předčíslím
            return `+${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 9)} ${limited.slice(9)}`;
        }
    } else {
        // Bez předčíslí: XXX XXX XXX (max 9 číslic)
        const limited = cleaned.slice(0, 9);

        if (limited.length <= 3) {
            return limited;
        } else if (limited.length <= 6) {
            return `${limited.slice(0, 3)} ${limited.slice(3)}`;
        } else {
            return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
        }
    }
}

// Formátování PSČ: XXX XX
export function formatPostalCode(value) {
    // Povolit pouze číslice
    const cleaned = value.replace(/\D/g, '');

    // Omezit na 5 číslic
    const limited = cleaned.slice(0, 5);

    // Formátovat jako XXX XX
    if (limited.length <= 3) {
        return limited;
    } else {
        return `${limited.slice(0, 3)} ${limited.slice(3)}`;
    }
}

// Odstranění diakritiky z textu pro vyhledávání
export function removeDiacritics(text) {
    if (!text) return '';

    return text
        .normalize('NFD') // Rozloží znaky s diakritikou na základní znak + combining diacritical mark
        .replace(/[\u0300-\u036f]/g, '') // Odstraní combining diacritical marks
        .toLowerCase();
}

/**
 * Formátuje datum do českého formátu
 * @param {string|Date} date - Datum jako ISO string nebo Date objekt
 * @returns {string} Formátované datum (např. "13. 12. 2024")
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
 * Formátuje datum a čas do českého formátu
 * @param {string|Date} date - Datum jako ISO string nebo Date objekt
 * @returns {string} Formátované datum a čas (např. "13. 12. 2024 14:30")
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
 * Formátuje čas
 * @param {string|Date} date - Datum jako ISO string nebo Date objekt
 * @returns {string} Formátovaný čas (např. "14:30")
 */
export function formatTime(date) {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return new Intl.DateTimeFormat('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(dateObj);
}