package cz.zcu.kiv.caretracker.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Number of performed tasks and minutes (HOUR tasks) of one caregiver in the current month.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CaregiverWorkloadDTO {
    private Long employeeId;
    private String name;
    private Integer tasksCount;
    private Integer minutes;
}
