package cz.zcu.kiv.caretracker.enums;

public enum UnitType {
    HOUR("Hodina"),
    OCCURRENCE("Úkon"),
    KG("Kg"),
    KM("Km");

    private final String displayName;

    UnitType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
