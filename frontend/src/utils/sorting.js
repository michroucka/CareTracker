/**
 * Compares two values with Czech locale support for strings.
 * @param {any} a
 * @param {any} b
 * @param {string} [locale='cs-CZ']
 * @returns {number} -1, 0, or 1
 */
export function compareValues(a, b, locale = 'cs-CZ') {
    if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b, locale, { sensitivity: 'base' });
    }

    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/**
 * Returns a sorted copy of an object array, ordered by the given key.
 * @param {Array} array
 * @param {string} key property to sort by
 * @param {'ascending'|'descending'} [direction='ascending']
 * @returns {Array}
 */
export function sortByKey(array, key, direction = 'ascending') {
    return [...array].sort((a, b) => {
        const cmp = compareValues(a[key], b[key]);
        return direction === 'ascending' ? cmp : -cmp;
    });
}

/**
 * Returns a sorted copy of a string array using Czech locale.
 * @param {Array<string>} array
 * @param {'ascending'|'descending'} [direction='ascending']
 * @returns {Array<string>}
 */
export function sortStrings(array, direction = 'ascending') {
    return [...array].sort((a, b) => {
        const cmp = compareValues(a, b);
        return direction === 'ascending' ? cmp : -cmp;
    });
}
