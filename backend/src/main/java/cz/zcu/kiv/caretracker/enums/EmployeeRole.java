package cz.zcu.kiv.caretracker.enums;

public enum EmployeeRole {
    CAREGIVER("Pečovatel"),
    COORDINATOR("Koordinátor"),
    MANAGER("Vedoucí");

    private final String displayName;

    EmployeeRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
