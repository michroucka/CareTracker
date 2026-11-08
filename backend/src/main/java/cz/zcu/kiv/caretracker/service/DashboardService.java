package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.dashboard.CaregiverWorkloadDTO;
import cz.zcu.kiv.caretracker.dto.dashboard.ClientAttentionDTO;
import cz.zcu.kiv.caretracker.dto.dashboard.DashboardDTO;
import cz.zcu.kiv.caretracker.dto.dashboard.DepartmentPerformedTasksDTO;
import cz.zcu.kiv.caretracker.dto.dashboard.OrganizationOverviewDTO;
import cz.zcu.kiv.caretracker.dto.dashboard.PlatformOverviewDTO;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.UnitType;
import cz.zcu.kiv.caretracker.enums.UserRole;
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
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Builds role-specific dashboard data.
 * CAREGIVER, COORDINATOR and ADMIN get statistics of their own work, department or organization;
 * SUPERADMIN gets an application-wide overview with counts only, never client personal data.
 */
@Service
@Transactional(readOnly = true)
public class DashboardService extends BaseRoleFilteringService<PerformedTask, DashboardDTO> {

    /** A client without a performed task for this many days needs attention. */
    private static final int RECENT_RECORD_DAYS = 14;
    private static final int ATTENTION_LIST_LIMIT = 6;
    private static final int PLAN_UPDATE_HORIZON_DAYS = 30;

    @Autowired private PerformedTaskRepository performedTaskRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private OrganizationRepository organizationRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private IndividualPlanRepository individualPlanRepository;
    @Autowired private PerformedTaskMapper performedTaskMapper;
    @Autowired private DashboardMapper dashboardMapper;

    /**
     * Returns dashboard data appropriate for the current user's role.
     * Returns an empty DTO for roles without a dashboard (CLIENT).
     *
     * @return the dashboard DTO
     */
    public DashboardDTO getDashboard() {
        User user = getCurrentUser();
        return switch (user.getRole()) {
            case CAREGIVER -> buildCaregiverDashboard(user);
            case COORDINATOR -> buildCoordinatorDashboard(user);
            case ADMIN -> buildAdminDashboard(user);
            case SUPERADMIN -> buildSuperadminDashboard();
            default -> new DashboardDTO();
        };
    }

    /** Builds the CAREGIVER dashboard: their own tasks today and this month, their clients and plans. */
    private DashboardDTO buildCaregiverDashboard(User user) {
        Long caregiverId = user.getEmployee().getId();
        List<PerformedTask> monthTasks = performedTaskRepository
                .findByCaregivers_IdAndDateBetween(caregiverId, monthStart(), monthEnd());
        List<PerformedTask> historyTasks = performedTaskRepository
                .findByCaregivers_IdAndDateBetween(caregiverId, twelveMonthsStart(), monthEnd());
        List<PerformedTask> todayTasks = monthTasks.stream()
                .filter(t -> t.getDate().toLocalDate().equals(LocalDate.now()))
                .toList();

        DashboardDTO dto = new DashboardDTO();
        dto.setTodayTasksCount(todayTasks.size());
        dto.setTodayMinutes(calculateTotalMinutes(todayTasks));
        dto.setTasksPerformedCount(monthTasks.size());
        dto.setMyClientsCount((int) clientRepository.countByActiveTrueAndCaregiverId(caregiverId));
        dto.setTotalMonthMinutes(calculateTotalMinutes(monthTasks));
        dto.setTasksPerformedCountHistory(buildCountHistory(historyTasks));
        dto.setRecentPerformedTasks(performedTaskMapper.toSummaryDTOList(
                performedTaskRepository.findTop5ByCaregivers_IdOrderByDateDesc(caregiverId)));
        dto.setClientIPUpdates(dashboardMapper.toClientIPUpdateDTOList(
                individualPlanRepository.findUpcomingUpdatesByCaregiver(caregiverId, planUpdateHorizon())));
        fillClientsWithoutRecentRecords(dto, clientRepository.findByActiveTrueAndCaregiverId(caregiverId));
        return dto;
    }

    /** Builds the COORDINATOR dashboard: department income, tasks, caregiver workload and clients needing attention. */
    private DashboardDTO buildCoordinatorDashboard(User user) {
        Long deptId = user.getEmployee().getDepartment().getId();
        List<PerformedTask> monthTasks = performedTaskRepository
                .findByDepartmentIdAndDateBetween(deptId, monthStart(), monthEnd());
        List<PerformedTask> historyTasks = performedTaskRepository
                .findByDepartmentIdAndDateBetween(deptId, twelveMonthsStart(), monthEnd());

        DashboardDTO dto = new DashboardDTO();
        dto.setClientCount((int) clientRepository.countByActiveTrueAndDepartmentId(deptId));
        dto.setTasksPerformedCount(monthTasks.size());
        dto.setTotalMonthlyIncome(sumPrices(monthTasks));
        dto.setMonthlyIncomeHistory(buildIncomeHistory(historyTasks));
        dto.setTasksPerformedCountHistory(buildCountHistory(historyTasks));
        dto.setCaregiverWorkload(buildCaregiverWorkload(deptId, monthTasks));
        dto.setRecentPerformedTasks(performedTaskMapper.toSummaryDTOList(
                performedTaskRepository.findTop5ByDepartmentIdOrderByDateDesc(deptId)));
        dto.setClientIPUpdates(dashboardMapper.toClientIPUpdateDTOList(
                individualPlanRepository.findUpcomingUpdatesByDepartment(deptId, planUpdateHorizon())));
        fillClientsWithoutRecentRecords(dto, clientRepository.findByActiveTrueAndDepartmentId(deptId));
        return dto;
    }

    /** Builds the ADMIN dashboard: organization-wide income, counts, per-department breakdown and attention lists. */
    private DashboardDTO buildAdminDashboard(User user) {
        Long orgId = user.getEmployee().getOrganization().getId();
        List<PerformedTask> monthTasks = performedTaskRepository
                .findByOrganizationIdAndDateBetween(orgId, monthStart(), monthEnd());
        List<PerformedTask> historyTasks = performedTaskRepository
                .findByOrganizationIdAndDateBetween(orgId, twelveMonthsStart(), monthEnd());

        DashboardDTO dto = new DashboardDTO();
        dto.setClientCount((int) clientRepository.countByActiveTrueAndOrganizationId(orgId));
        dto.setEmployeeCount((int) employeeRepository.countByActiveTrueAndOrganizationId(orgId));
        dto.setDepartmentCount((int) departmentRepository.countByActiveTrueAndOrganizationId(orgId));
        dto.setTasksPerformedCount(monthTasks.size());
        dto.setTotalMonthlyIncome(sumPrices(monthTasks));
        dto.setMonthlyIncomeHistory(buildIncomeHistory(historyTasks));
        dto.setTasksPerformedCountHistory(buildCountHistory(historyTasks));
        dto.setRecentPerformedTasks(performedTaskMapper.toSummaryDTOList(
                performedTaskRepository.findTop5ByOrganizationIdOrderByDateDesc(orgId)));
        dto.setTasksPerformedByDepartment(buildDepartmentTaskCounts(monthTasks));
        dto.setClientIPUpdates(dashboardMapper.toClientIPUpdateDTOList(
                individualPlanRepository.findUpcomingUpdatesByOrganization(orgId, planUpdateHorizon())));
        fillClientsWithoutRecentRecords(dto, clientRepository.findByActiveTrueAndOrganizationId(orgId));
        return dto;
    }

    /** Builds the SUPERADMIN overview across all organizations. Only counts, never client names or details. */
    private DashboardDTO buildSuperadminDashboard() {
        LocalDateTime monthStart = monthStart();
        List<PerformedTask> historyTasks = performedTaskRepository.findByDateBetween(twelveMonthsStart(), monthEnd());
        Map<Long, Long> tasksThisMonthByOrganization = historyTasks.stream()
                .filter(t -> !t.getDate().isBefore(monthStart))
                .collect(Collectors.groupingBy(t -> t.getOrganization().getId(), Collectors.counting()));
        Map<Long, LocalDateTime> lastActivityByOrganization = toDateMap(performedTaskRepository.findLastActivityByOrganization());

        List<OrganizationOverviewDTO> organizations = organizationRepository.findByActive(true).stream()
                .map(org -> new OrganizationOverviewDTO(
                        org.getId(),
                        org.getName(),
                        (int) departmentRepository.countByActiveTrueAndOrganizationId(org.getId()),
                        (int) employeeRepository.countByActiveTrueAndOrganizationId(org.getId()),
                        (int) clientRepository.countByActiveTrueAndOrganizationId(org.getId()),
                        tasksThisMonthByOrganization.getOrDefault(org.getId(), 0L).intValue(),
                        lastActivityByOrganization.get(org.getId())))
                .sorted(Comparator.comparing(OrganizationOverviewDTO::getTasksThisMonth).reversed())
                .toList();

        Map<String, Long> activeUsersByRole = new LinkedHashMap<>();
        for (UserRole role : UserRole.values()) {
            activeUsersByRole.put(role.name(), userRepository.countByRoleAndActiveTrue(role));
        }

        List<Integer> tasksHistory = buildCountHistory(historyTasks);
        PlatformOverviewDTO platform = new PlatformOverviewDTO(
                organizations.size(),
                (int) departmentRepository.countByActiveTrue(),
                (int) employeeRepository.countByActiveTrue(),
                (int) clientRepository.countByActiveTrue(),
                activeUsersByRole,
                userRepository.countByActivationTokenIsNotNullAndPasswordIsNull(),
                userRepository.countByActivationTokenIsNotNullAndPasswordIsNullAndTokenExpiryBefore(LocalDateTime.now()),
                tasksHistory.get(tasksHistory.size() - 1),
                tasksHistory,
                organizations);

        DashboardDTO dto = new DashboardDTO();
        dto.setPlatform(platform);
        return dto;
    }

    /**
     * Fills the clients that have had no performed task for {@link #RECENT_RECORD_DAYS} days,
     * longest without a record first. Clients created within that period are skipped.
     */
    private void fillClientsWithoutRecentRecords(DashboardDTO dto, List<Client> clients) {
        LocalDate threshold = LocalDate.now().minusDays(RECENT_RECORD_DAYS);
        List<Client> establishedClients = clients.stream()
                .filter(c -> c.getCreated() == null || c.getCreated().isBefore(threshold))
                .toList();
        Map<Long, LocalDateTime> lastRecords = establishedClients.isEmpty()
                ? Map.of()
                : toDateMap(performedTaskRepository.findLastRecordDatesByClientIds(
                        establishedClients.stream().map(Client::getId).toList()));

        List<ClientAttentionDTO> withoutRecentRecords = establishedClients.stream()
                .map(c -> new ClientAttentionDTO(c.getId(), c.getFullName(), lastRecords.get(c.getId())))
                .filter(a -> a.getLastRecordDate() == null || a.getLastRecordDate().toLocalDate().isBefore(threshold))
                .sorted(Comparator.comparing(ClientAttentionDTO::getLastRecordDate, Comparator.nullsFirst(Comparator.naturalOrder())))
                .toList();

        dto.setClientsWithoutRecentRecordsCount(withoutRecentRecords.size());
        dto.setClientsWithoutRecentRecords(withoutRecentRecords.stream().limit(ATTENTION_LIST_LIMIT).toList());
    }

    /** Tasks and minutes per active caregiver of the department this month, busiest first. */
    private List<CaregiverWorkloadDTO> buildCaregiverWorkload(Long deptId, List<PerformedTask> monthTasks) {
        Map<Long, Integer> taskCounts = new HashMap<>();
        Map<Long, Integer> minutes = new HashMap<>();
        for (PerformedTask task : monthTasks) {
            for (Employee caregiver : task.getCaregivers()) {
                taskCounts.merge(caregiver.getId(), 1, Integer::sum);
                minutes.merge(caregiver.getId(), minutesOf(task), Integer::sum);
            }
        }
        return employeeRepository.findByActiveTrueAndDepartmentId(deptId).stream()
                .filter(e -> e.getRole() == EmployeeRole.CAREGIVER)
                .map(e -> new CaregiverWorkloadDTO(
                        e.getId(), e.getFullName(), taskCounts.getOrDefault(e.getId(), 0), minutes.getOrDefault(e.getId(), 0)))
                .sorted(Comparator.comparing(CaregiverWorkloadDTO::getTasksCount).reversed())
                .toList();
    }

    private LocalDateTime monthStart() {
        return YearMonth.now().atDay(1).atStartOfDay();
    }

    private LocalDateTime monthEnd() {
        return monthStart().plusMonths(1);
    }

    private LocalDateTime twelveMonthsStart() {
        return YearMonth.now().minusMonths(11).atDay(1).atStartOfDay();
    }

    private LocalDate planUpdateHorizon() {
        return LocalDate.now().plusDays(PLAN_UPDATE_HORIZON_DAYS);
    }

    /** Converts query rows of [id, date] into a map. */
    private Map<Long, LocalDateTime> toDateMap(List<Object[]> rows) {
        Map<Long, LocalDateTime> result = new HashMap<>();
        for (Object[] row : rows) {
            result.put((Long) row[0], (LocalDateTime) row[1]);
        }
        return result;
    }

    private int sumPrices(List<PerformedTask> tasks) {
        return tasks.stream().mapToInt(PerformedTask::calculatePrice).sum();
    }

    /** Unit count of HOUR tasks is stored in minutes; other unit types do not count towards time. */
    private int minutesOf(PerformedTask task) {
        return task.getTask().getUnitType() == UnitType.HOUR ? task.getUnitCount().intValue() : 0;
    }

    private Integer calculateTotalMinutes(List<PerformedTask> tasks) {
        return tasks.stream().mapToInt(this::minutesOf).sum();
    }

    /** Returns a 12-element list of monthly task counts, oldest month first (current month last). */
    private List<Integer> buildCountHistory(List<PerformedTask> tasks) {
        List<Integer> history = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth month = YearMonth.now().minusMonths(i);
            int count = (int) tasks.stream()
                    .filter(t -> YearMonth.from(t.getDate()).equals(month))
                    .count();
            history.add(count);
        }
        return history;
    }

    /** Returns a 12-element list of monthly income totals (in CZK), oldest month first (current month last). */
    private List<Integer> buildIncomeHistory(List<PerformedTask> tasks) {
        List<Integer> history = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth month = YearMonth.now().minusMonths(i);
            history.add(sumPrices(tasks.stream()
                    .filter(t -> YearMonth.from(t.getDate()).equals(month))
                    .toList()));
        }
        return history;
    }

    /** Task count and income per department, busiest first. */
    private List<DepartmentPerformedTasksDTO> buildDepartmentTaskCounts(List<PerformedTask> tasks) {
        Map<Long, String> deptNames = new HashMap<>();
        Map<Long, Integer> deptCounts = new HashMap<>();
        Map<Long, Integer> deptIncome = new HashMap<>();
        for (PerformedTask t : tasks) {
            Long id = t.getDepartment().getId();
            deptNames.put(id, t.getDepartment().getCity());
            deptCounts.merge(id, 1, Integer::sum);
            deptIncome.merge(id, t.calculatePrice(), Integer::sum);
        }
        return deptCounts.keySet().stream()
                .map(id -> new DepartmentPerformedTasksDTO(deptNames.get(id), deptCounts.get(id), deptIncome.get(id)))
                .sorted(Comparator.comparing(DepartmentPerformedTasksDTO::getPerformedTasksCount).reversed())
                .collect(Collectors.toList());
    }
}
