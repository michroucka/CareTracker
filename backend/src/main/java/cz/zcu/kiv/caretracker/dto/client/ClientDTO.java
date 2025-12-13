package cz.zcu.kiv.caretracker.dto.client;

import cz.zcu.kiv.caretracker.dto.DepartmentDTO;
import cz.zcu.kiv.caretracker.dto.EmployeeDTO;
import cz.zcu.kiv.caretracker.dto.TaskDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String gender;
    private Long personalNumber;
    private LocalDate dateOfBirth;
    private LocalDate terminationDate;
    private String terminationReason;
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
    private List<TaskDTO> tasks;
}
