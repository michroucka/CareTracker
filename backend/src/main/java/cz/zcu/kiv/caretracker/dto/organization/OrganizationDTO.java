package cz.zcu.kiv.caretracker.dto.organization;

import cz.zcu.kiv.caretracker.dto.employee.EmployeeDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationDTO {
    private Long id;
    private String name;
    private Boolean active;
    private EmployeeDTO manager;
}
