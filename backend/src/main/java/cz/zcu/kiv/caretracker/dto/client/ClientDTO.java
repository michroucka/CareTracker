package cz.zcu.kiv.caretracker.dto.client;

import cz.zcu.kiv.caretracker.dto.department.DepartmentSummaryDTO;
import cz.zcu.kiv.caretracker.dto.task.TaskDTO;
import cz.zcu.kiv.caretracker.dto.employee.EmployeeSummaryDTO;
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
    private Boolean hasPicture;

    private DepartmentSummaryDTO department;
    private EmployeeSummaryDTO caregiver;
    private List<TaskDTO> tasks;
}
