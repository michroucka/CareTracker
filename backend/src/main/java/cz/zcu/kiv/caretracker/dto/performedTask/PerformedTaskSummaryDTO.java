package cz.zcu.kiv.caretracker.dto.performedTask;

import cz.zcu.kiv.caretracker.dto.department.DepartmentSummaryDTO;
import cz.zcu.kiv.caretracker.dto.employee.EmployeeSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerformedTaskSummaryDTO {
    private Long id;
    private LocalDateTime date;
    private Double unitCount;
    private String clientName;
    private String taskName;
    private String unitType;
    private Integer price;

    private DepartmentSummaryDTO department;
    private List<EmployeeSummaryDTO> caregivers;
}
