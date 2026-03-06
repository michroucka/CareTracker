package cz.zcu.kiv.caretracker.dto.department;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentRequestDTO {
    private String street;
    private String city;
    private String postalCode;
    private Integer departmentNumber;
    private Boolean active;
    private Long coordinatorId;
    private Long organizationId;
}
