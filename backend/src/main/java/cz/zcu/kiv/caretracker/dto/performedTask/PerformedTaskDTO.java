package cz.zcu.kiv.caretracker.dto.performedTask;

import cz.zcu.kiv.caretracker.dto.DepartmentDTO;
import cz.zcu.kiv.caretracker.dto.EmployeeDTO;
import cz.zcu.kiv.caretracker.dto.TaskDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientDTO;
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
    private Integer unitCount;
    private String notes;

    private ClientDTO client;
    private TaskDTO task;
    private DepartmentDTO department;
    private List<EmployeeDTO> caregivers;
}
