package cz.zcu.kiv.caretracker.enums;

public enum BenefitLevel {
    NONE("Žádný"),
    ONE("První"),
    TWO("Druhý"),
    THREE("Třetí"),
    FOUR("Čtvrtý");

    private final String displayName;

    BenefitLevel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
