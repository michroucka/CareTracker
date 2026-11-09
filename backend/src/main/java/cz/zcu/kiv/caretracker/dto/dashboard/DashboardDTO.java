package cz.zcu.kiv.caretracker.dto.dashboard;

import cz.zcu.kiv.caretracker.dto.performedTask.PerformedTaskSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {
    // CAREGIVER only
    // shown view and the views the user may switch to (staff dashboards only)
    private DashboardView view;
    private List<DashboardView> availableViews;

    private Integer myClientsCount;
    private Integer totalMonthMinutes;
    private Integer todayTasksCount;
    private Integer todayMinutes;

    // CAREGIVER + COORDINATOR + ADMIN
    private Integer tasksPerformedCount;
    private List<Integer> tasksPerformedCountHistory;
    private List<ClientIPUpdateDTO> clientIPUpdates;
    private List<ClientAttentionDTO> clientsWithoutRecentRecords;
    private Integer clientsWithoutRecentRecordsCount;

    // COORDINATOR only
    private List<CaregiverWorkloadDTO> caregiverWorkload;

    // COORDINATOR + ADMIN
    private Integer clientCount;
    private Integer totalMonthlyIncome;
    private List<Integer> monthlyIncomeHistory;

    // ADMIN only
    private Integer employeeCount;
    private Integer departmentCount;
    private List<DepartmentPerformedTasksDTO> tasksPerformedByDepartment;

    // SUPERADMIN only
    private PlatformOverviewDTO platform;

    // all roles except SUPERADMIN
    private List<PerformedTaskSummaryDTO> recentPerformedTasks;
}
