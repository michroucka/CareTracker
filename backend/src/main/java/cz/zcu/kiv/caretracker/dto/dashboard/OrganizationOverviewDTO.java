package cz.zcu.kiv.caretracker.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Aggregated, anonymous overview of one organization for the SUPERADMIN dashboard (counts only, no client data).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrganizationOverviewDTO {
    private Long id;
    private String name;
    private Integer departmentCount;
    private Integer employeeCount;
    private Integer clientCount;
    private Integer tasksThisMonth;
    private LocalDateTime lastActivity;
}
