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
    private Integer myClientsCount;
    private Integer totalMonthMinutes;
    private List<Integer> tasksPerformedCountHistory;

    // CAREGIVER + COORDINATOR
    private Integer tasksPerformedCount;
    private List<ClientIPUpdateDTO> clientIPUpdates;

    // COORDINATOR + ADMIN
    private Integer clientCount;
    private Integer totalMonthlyIncome;
    private List<Integer> monthlyIncomeHistory;

    // ADMIN only
    private Integer employeeCount;
    private List<Integer> tasksPerformedByDepartment;

    // all roles
    private List<PerformedTaskSummaryDTO> recentPerformedTasks;
}
