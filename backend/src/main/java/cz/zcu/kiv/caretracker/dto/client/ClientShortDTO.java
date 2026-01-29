package cz.zcu.kiv.caretracker.dto.client;

import cz.zcu.kiv.caretracker.dto.department.DepartmentSummaryDTO;
import cz.zcu.kiv.caretracker.dto.employee.EmployeeSummaryDTO;
import cz.zcu.kiv.caretracker.dto.task.TaskDTO;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Lightweight DTO pro seznam klientů s minimální duplikací dat.
 * Obsahuje jen ID a názvy pro relace - frontend má již načtené seznamy departments/caregivers.
 */
@Getter
@Setter
public class ClientShortDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String gender;
    private String street;
    private String city;
    private Boolean active;

    private DepartmentSummaryDTO department;
    private EmployeeSummaryDTO caregiver;
    private List<TaskDTO> tasks;
}
