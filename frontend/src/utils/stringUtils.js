/**
 * Převede první písmeno na velké a zbytek na malé
 * @param {string} s - Řetězec k převedení
 * @returns {string} - Převedený řetězec
 */
export function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}
