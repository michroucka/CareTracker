package cz.zcu.kiv.caretracker.enums;

public enum EmployeeRole {
    CAREGIVER,
    COORDINATOR,
    MANAGER;

    /**
     * Převede EmployeeRole na odpovídající UserRole.
     */
    public UserRole toUserRole() {
        return switch (this) {
            case CAREGIVER -> UserRole.CAREGIVER;
            case COORDINATOR -> UserRole.COORDINATOR;
            case MANAGER -> UserRole.ADMIN;
        };
    }
}
