package cz.zcu.kiv.caretracker.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DepartmentPerformedTasksDTO {
    private String departmentName;
    private Integer performedTasksCount;
}
