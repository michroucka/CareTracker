package cz.zcu.kiv.caretracker.dto.employee;

import cz.zcu.kiv.caretracker.dto.department.DepartmentDTO;
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

    private DepartmentDTO department;
    private OrganizationInfo organization;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrganizationInfo {
        private Long id;
        private String name;
    }
}
