package cz.zcu.kiv.caretracker.enums;

import lombok.Getter;

@Getter
public enum UnitType {
    HOUR("min"),
    OCCURRENCE("úkon"),
    KG("kg"),
    KM("km");

    private final String label;

    UnitType(String label) {
        this.label = label;
    }
}
