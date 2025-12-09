// Definice rolí v systému (hodnoty odpovídají UserRole enum z backendu)
export const ROLES = {
    SUPERADMIN: "SUPERADMIN",
    ADMIN: "ADMIN",
    COORDINATOR: "COORDINATOR",
    CAREGIVER: "CAREGIVER",
    CLIENT: "CLIENT"
};

// České názvy rolí pro zobrazení v UI
export const ROLE_LABELS = {
    SUPERADMIN: "Superadmin",
    ADMIN: "Administrátor",
    COORDINATOR: "Koordinátor",
    CAREGIVER: "Pečovatel",
    CLIENT: "Klient"
};

/**
 * Získá český název role pro zobrazení v UI
 * @param {string} role - Role z backendu (např. "MANAGER")
 * @returns {string} - Český název role (např. "Manažer")
 */
export function getRoleLabel(role) {
    return ROLE_LABELS[role] || role;
}

/**
 * Zkontroluje, zda uživatel má některou z povolených rolí
 * @param {string} userRole - Role uživatele z backendu
 * @param {Array<string>} allowedRoles - Pole povolených rolí
 * @returns {boolean}
 */
export function hasRole(userRole, allowedRoles) {
    if (!allowedRoles || allowedRoles.length === 0) {
        return true; // Pokud nejsou definované role, přístup povolen
    }
    return allowedRoles.includes(userRole);
}