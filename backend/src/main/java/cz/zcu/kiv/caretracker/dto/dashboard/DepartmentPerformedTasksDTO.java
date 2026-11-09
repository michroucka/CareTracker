package cz.zcu.kiv.caretracker.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Performed tasks count and income of one department in the current month.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DepartmentPerformedTasksDTO {
    private String departmentName;
    private Integer performedTasksCount;
    private Integer income;
}
