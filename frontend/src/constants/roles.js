/** Role constants matching the UserRole enum on the backend. */
export const ROLES = {
    SUPERADMIN: "SUPERADMIN",
    ADMIN: "ADMIN",
    COORDINATOR: "COORDINATOR",
    CAREGIVER: "CAREGIVER",
    CLIENT: "CLIENT"
};

/** Czech display labels for each role, used in the UI. */
export const ROLE_LABELS = {
    SUPERADMIN: "Superadmin",
    ADMIN: "Administrátor",
    COORDINATOR: "Koordinátor",
    CAREGIVER: "Pečovatel",
    CLIENT: "Klient",
    MANAGER: "Vedoucí"
};

/**
 * Returns the Czech UI label for a given role key.
 * Falls back to the raw role string if no label is defined.
 * @param {string} role backend role value (e.g. "MANAGER")
 * @returns {string}
 */
export function getRoleLabel(role) {
    return ROLE_LABELS[role] || role;
}

/**
 * Returns true if the user's role is included in the allowed roles list.
 * Returns true when allowedRoles is empty or undefined (no restriction).
 * @param {string} userRole the user's role from the backend
 * @param {Array<string>} allowedRoles the permitted roles
 * @returns {boolean}
 */
export function hasRole(userRole, allowedRoles) {
    if (!allowedRoles || allowedRoles.length === 0) {
        return true;
    }
    return allowedRoles.includes(userRole);
}
