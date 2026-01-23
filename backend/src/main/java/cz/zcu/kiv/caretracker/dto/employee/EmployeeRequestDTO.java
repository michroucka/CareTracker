package cz.zcu.kiv.caretracker.dto.employee;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRequestDTO {
    private String firstName;
    private String lastName;
    private String role;
    private Long departmentId;
    private String email;
    private Boolean isAdmin;
}
