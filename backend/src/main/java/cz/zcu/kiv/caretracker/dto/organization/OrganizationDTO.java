package cz.zcu.kiv.caretracker.dto.organization;

import cz.zcu.kiv.caretracker.dto.employee.EmployeeSummaryDTO;
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
    private String accountPrefix;
    private String accountNumber;
    private String bankCode;
    private EmployeeSummaryDTO manager;
}
