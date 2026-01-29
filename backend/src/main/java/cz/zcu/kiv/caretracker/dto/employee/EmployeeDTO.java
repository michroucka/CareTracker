package cz.zcu.kiv.caretracker.dto.employee;

import cz.zcu.kiv.caretracker.dto.department.DepartmentSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String role;
    private Boolean active;
    private String email;
    private Boolean isAdmin;

    private DepartmentSummaryDTO department;
}
