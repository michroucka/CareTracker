package cz.zcu.kiv.caretracker.enums;

public enum Gender {
    MALE("Muž"),
    FEMALE("Žena");

    private final String displayName;

    Gender(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
