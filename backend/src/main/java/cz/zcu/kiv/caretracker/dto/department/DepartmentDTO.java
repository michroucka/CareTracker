package cz.zcu.kiv.caretracker.dto.department;

import cz.zcu.kiv.caretracker.dto.employee.EmployeeSummaryDTO;
import cz.zcu.kiv.caretracker.dto.organization.OrganizationSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentDTO {
    private Long id;
    private String city;
    private String street;
    private String postalCode;
    private Integer departmentNumber;
    private Boolean active;

    private EmployeeSummaryDTO coordinator;
    private OrganizationSummaryDTO organization;
}
