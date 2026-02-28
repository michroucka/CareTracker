package cz.zcu.kiv.caretracker.dto.performedTask;

import cz.zcu.kiv.caretracker.dto.client.ClientSummaryDTO;
import cz.zcu.kiv.caretracker.dto.department.DepartmentSummaryDTO;
import cz.zcu.kiv.caretracker.dto.task.TaskDTO;
import cz.zcu.kiv.caretracker.dto.employee.EmployeeSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerformedTaskDTO {
    private Long id;
    private LocalDateTime date;
    private Double unitCount;
    private String notes;

    private ClientSummaryDTO client;
    private TaskDTO task;
    private DepartmentSummaryDTO department;
    private List<EmployeeSummaryDTO> caregivers;
}
