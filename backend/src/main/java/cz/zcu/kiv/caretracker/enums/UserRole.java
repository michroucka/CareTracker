package cz.zcu.kiv.caretracker.enums;

public enum UserRole {
    CAREGIVER("Pečovatel"),
    COORDINATOR("Koordinátor"),
    ADMIN("Vedoucí"),
    CLIENT("Klient");

    private final String displayName;

    UserRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
