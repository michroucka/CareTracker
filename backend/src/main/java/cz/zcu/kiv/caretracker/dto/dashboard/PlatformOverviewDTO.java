package cz.zcu.kiv.caretracker.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

/**
 * Application-wide statistics for the SUPERADMIN, who manages the application but does not belong to any organization.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlatformOverviewDTO {
    private Integer organizationCount;
    private Integer departmentCount;
    private Integer employeeCount;
    private Integer clientCount;
    private Map<String, Long> activeUsersByRole;
    private Long pendingActivationCount;
    private Long expiredActivationCount;
    private Integer tasksThisMonth;
    private List<Integer> tasksHistory;
    private List<OrganizationOverviewDTO> organizations;
}
