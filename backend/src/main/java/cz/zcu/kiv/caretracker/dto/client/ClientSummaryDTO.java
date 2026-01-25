package cz.zcu.kiv.caretracker.dto.client;

import lombok.Getter;
import lombok.Setter;

/**
 * Lightweight DTO pro seznam klientů s minimální duplikací dat.
 * Obsahuje jen ID a názvy pro relace - frontend má již načtené seznamy departments/caregivers.
 */
@Getter
@Setter
public class ClientSummaryDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String gender;
    private String street;
    private String city;
    private Boolean active;

    // Department - jen ID a název (bez vnořených objektů)
    private Long departmentId;
    private String departmentName;

    // Caregiver - jen ID a jméno (bez vnořených objektů)
    private Long caregiverId;
    private String caregiverFirstName;
    private String caregiverLastName;
}
