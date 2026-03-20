package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.dashboard.DashboardDTO;
import cz.zcu.kiv.caretracker.dto.dashboard.DepartmentPerformedTasksDTO;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.UnitType;
import cz.zcu.kiv.caretracker.mapper.DashboardMapper;
import cz.zcu.kiv.caretracker.mapper.PerformedTaskMapper;
import cz.zcu.kiv.caretracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService extends BaseRoleFilteringService<PerformedTask, DashboardDTO> {

    @Autowired private PerformedTaskRepository performedTaskRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private IndividualPlanRepository individualPlanRepository;
    @Autowired private PerformedTaskMapper performedTaskMapper;
    @Autowired private DashboardMapper dashboardMapper;

    public DashboardDTO getDashboard() {
        User user = getCurrentUser();
        return switch (user.getRole()) {
            case CAREGIVER -> buildCaregiverDashboard(user);
            case COORDINATOR -> buildCoordinatorDashboard(user);
            case ADMIN -> buildAdminDashboard(user);
            default -> new DashboardDTO();
        };
    }

    private DashboardDTO buildCaregiverDashboard(User user) {
        Long caregiverId = user.getEmployee().getId();
        Long deptId = user.getEmployee().getDepartment().getId();
        LocalDateTime monthStart = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime monthEnd = monthStart.plusMonths(1);
        LocalDateTime sixMonthsStart = YearMonth.now().minusMonths(5).atDay(1).atStartOfDay();

        List<PerformedTask> monthTasks = performedTaskRepository
                .findByCaregivers_IdAndDateBetween(caregiverId, monthStart, monthEnd);
        List<PerformedTask> historyTasks = performedTaskRepository
                .findByCaregivers_IdAndDateBetween(caregiverId, sixMonthsStart, monthEnd);

        DashboardDTO dto = new DashboardDTO();
        dto.setTasksPerformedCount(monthTasks.size());
        dto.setMyClientsCount((int) clientRepository.countByActiveTrueAndCaregiverId(caregiverId));
        dto.setTotalMonthMinutes(calculateTotalMinutes(monthTasks));
        dto.setTasksPerformedCountHistory(buildCountHistory(historyTasks));
        dto.setRecentPerformedTasks(performedTaskMapper.toSummaryDTOList(
                performedTaskRepository.findTop5ByDepartmentIdOrderByDateDesc(deptId)));
        dto.setClientIPUpdates(dashboardMapper.toClientIPUpdateDTOList(
                individualPlanRepository.findUpcomingUpdatesByCaregiver(
                        caregiverId, LocalDate.now().plusDays(30))));
        return dto;
    }

    private DashboardDTO buildCoordinatorDashboard(User user) {
        Long deptId = user.getEmployee().getDepartment().getId();
        LocalDateTime monthStart = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime monthEnd = monthStart.plusMonths(1);
        LocalDateTime sixMonthsStart = YearMonth.now().minusMonths(5).atDay(1).atStartOfDay();

        List<PerformedTask> monthTasks = performedTaskRepository
                .findByDepartmentIdAndDateBetween(deptId, monthStart, monthEnd);
        List<PerformedTask> historyTasks = performedTaskRepository
                .findByDepartmentIdAndDateBetween(deptId, sixMonthsStart, monthEnd);

        DashboardDTO dto = new DashboardDTO();
        dto.setClientCount((int) clientRepository.countByActiveTrueAndDepartmentId(deptId));
        dto.setTasksPerformedCount(monthTasks.size());
        dto.setTotalMonthlyIncome(monthTasks.stream().mapToInt(PerformedTask::calculatePrice).sum());
        dto.setMonthlyIncomeHistory(buildIncomeHistory(historyTasks));
        dto.setRecentPerformedTasks(performedTaskMapper.toSummaryDTOList(
                performedTaskRepository.findTop5ByDepartmentIdOrderByDateDesc(deptId)));
        dto.setClientIPUpdates(dashboardMapper.toClientIPUpdateDTOList(
                individualPlanRepository.findUpcomingUpdatesByDepartment(
                        deptId, LocalDate.now().plusDays(30))));
        return dto;
    }

    private DashboardDTO buildAdminDashboard(User user) {
        Long orgId = user.getEmployee().getOrganization().getId();
        LocalDateTime monthStart = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime monthEnd = monthStart.plusMonths(1);
        LocalDateTime sixMonthsStart = YearMonth.now().minusMonths(5).atDay(1).atStartOfDay();

        List<PerformedTask> monthTasks = performedTaskRepository
                .findByOrganizationIdAndDateBetween(orgId, monthStart, monthEnd);
        List<PerformedTask> historyTasks = performedTaskRepository
                .findByOrganizationIdAndDateBetween(orgId, sixMonthsStart, monthEnd);

        DashboardDTO dto = new DashboardDTO();
        dto.setClientCount((int) clientRepository.countByActiveTrueAndOrganizationId(orgId));
        dto.setEmployeeCount((int) employeeRepository.countByActiveTrueAndOrganizationId(orgId));
        dto.setTotalMonthlyIncome(monthTasks.stream().mapToInt(PerformedTask::calculatePrice).sum());
        dto.setMonthlyIncomeHistory(buildIncomeHistory(historyTasks));
        dto.setRecentPerformedTasks(performedTaskMapper.toSummaryDTOList(
                performedTaskRepository.findTop5ByOrganizationIdOrderByDateDesc(orgId)));
        dto.setTasksPerformedByDepartment(buildDepartmentTaskCounts(monthTasks));
        Long deptId = user.getEmployee().getDepartment().getId();
        dto.setClientIPUpdates(dashboardMapper.toClientIPUpdateDTOList(
                individualPlanRepository.findUpcomingUpdatesByDepartment(
                        deptId, LocalDate.now().plusDays(30))));
        return dto;
    }

    private Integer calculateTotalMinutes(List<PerformedTask> tasks) {
        return tasks.stream()
                .filter(t -> t.getTask().getUnitType() == UnitType.HOUR)
                .mapToInt(t -> t.getUnitCount().intValue())
                .sum();
    }

    private List<Integer> buildCountHistory(List<PerformedTask> tasks) {
        List<Integer> history = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth month = YearMonth.now().minusMonths(i);
            int count = (int) tasks.stream()
                    .filter(t -> YearMonth.from(t.getDate()).equals(month))
                    .count();
            history.add(count);
        }
        return history;
    }

    private List<Integer> buildIncomeHistory(List<PerformedTask> tasks) {
        List<Integer> history = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth month = YearMonth.now().minusMonths(i);
            int income = tasks.stream()
                    .filter(t -> YearMonth.from(t.getDate()).equals(month))
                    .mapToInt(PerformedTask::calculatePrice)
                    .sum();
            history.add(income);
        }
        return history;
    }

    private List<DepartmentPerformedTasksDTO> buildDepartmentTaskCounts(List<PerformedTask> tasks) {
        Map<Long, String> deptNames = new java.util.LinkedHashMap<>();
        Map<Long, Integer> deptCounts = new java.util.TreeMap<>();
        for (PerformedTask t : tasks) {
            Long id = t.getDepartment().getId();
            deptNames.put(id, t.getDepartment().getCity());
            deptCounts.merge(id, 1, Integer::sum);
        }
        return deptCounts.entrySet().stream()
                .map(e -> new DepartmentPerformedTasksDTO(deptNames.get(e.getKey()), e.getValue()))
                .collect(Collectors.toList());
    }
}
