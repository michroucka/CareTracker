package cz.zcu.kiv.caretracker.dto.department;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentSummaryDTO {
    private Long id;
    private String name;
    private Long organizationId;
}
