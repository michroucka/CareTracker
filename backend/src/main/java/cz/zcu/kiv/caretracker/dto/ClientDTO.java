package cz.zcu.kiv.caretracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String gender;
    private Integer personalNumber;
    private LocalDate dateOfBirth;
    private LocalDate dateOfDeath;
    private String email;
    private String phone;
    private String street;
    private String city;
    private String postalCode;
    private Boolean legallyCompetent;
    private String benefits;
    private String relativesContact;
    private String generalPractitioner;
    private String notes;
    private LocalDate created;
    private Boolean active;
    
    // Vnořené objekty
    private DepartmentDTO department;
    private EmployeeDTO caregiver;
}
