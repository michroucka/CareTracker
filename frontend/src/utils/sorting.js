/**
 * Porovná dvě hodnoty s podporou českého řazení
 * @param {any} a - První hodnota
 * @param {any} b - Druhá hodnota
 * @param {string} locale - Locale pro řazení (výchozí: 'cs-CZ')
 * @returns {number} -1, 0, nebo 1 pro řazení
 */
export function compareValues(a, b, locale = 'cs-CZ') {
    // Pro stringy použij lokalizované porovnání
    if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b, locale, { sensitivity: 'base' });
    }

    // Pro ostatní typy (čísla, objekty) použij standardní porovnání
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/**
 * Seřadí pole objektů podle zadané property
 * @param {Array} array - Pole objektů k seřazení
 * @param {string} key - Klíč podle kterého řadit
 * @param {string} direction - 'ascending' nebo 'descending'
 * @returns {Array} Seřazené pole
 */
export function sortByKey(array, key, direction = 'ascending') {
    return [...array].sort((a, b) => {
        const first = a[key];
        const second = b[key];

        const cmp = compareValues(first, second);

        return direction === 'ascending' ? cmp : -cmp;
    });
}

/**
 * Seřadí pole stringů s českým locale
 * @param {Array<string>} array - Pole stringů k seřazení
 * @param {string} direction - 'ascending' nebo 'descending'
 * @returns {Array<string>} Seřazené pole
 */
export function sortStrings(array, direction = 'ascending') {
    return [...array].sort((a, b) => {
        const cmp = compareValues(a, b);
        return direction === 'ascending' ? cmp : -cmp;
    });
}
