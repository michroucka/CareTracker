package cz.zcu.kiv.caretracker.enums;

public enum EmployeeRole {
    CAREGIVER,
    COORDINATOR,
    MANAGER;

    public UserRole toUserRole() {
        return switch (this) {
            case CAREGIVER -> UserRole.CAREGIVER;
            case COORDINATOR -> UserRole.COORDINATOR;
            case MANAGER -> UserRole.ADMIN;
        };
    }
}
