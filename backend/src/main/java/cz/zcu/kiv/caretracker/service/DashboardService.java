package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.dashboard.CaregiverWorkloadDTO;
import cz.zcu.kiv.caretracker.dto.dashboard.ClientAttentionDTO;
import cz.zcu.kiv.caretracker.dto.dashboard.DashboardDTO;
import cz.zcu.kiv.caretracker.dto.dashboard.DepartmentPerformedTasksDTO;
import cz.zcu.kiv.caretracker.dto.dashboard.OrganizationOverviewDTO;
import cz.zcu.kiv.caretracker.dto.dashboard.PlatformOverviewDTO;
import cz.zcu.kiv.caretracker.entity.Client;
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
        List<MonthTotals> history = monthlyTotals(null, null, caregiverId);
        List<PerformedTask> todayTasks = performedTaskRepository.findByCaregivers_IdAndDateBetween(
                caregiverId, LocalDate.now().atStartOfDay(), LocalDate.now().plusDays(1).atStartOfDay());
        List<PerformedTask> monthTasks = performedTaskRepository
                .findByCaregivers_IdAndDateBetween(caregiverId, monthStart(), monthEnd());

        DashboardDTO dto = new DashboardDTO();
        dto.setTodayTasksCount(todayTasks.size());
        dto.setTodayMinutes(calculateTotalMinutes(todayTasks));
        dto.setTasksPerformedCount(currentMonth(history).count());
        dto.setMyClientsCount((int) clientRepository.countByActiveTrueAndCaregiverId(caregiverId));
        dto.setTotalMonthMinutes(calculateTotalMinutes(monthTasks));
        dto.setTasksPerformedCountHistory(counts(history));
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
        List<MonthTotals> history = monthlyTotals(null, deptId, null);

        DashboardDTO dto = new DashboardDTO();
        dto.setClientCount((int) clientRepository.countByActiveTrueAndDepartmentId(deptId));
        dto.setTasksPerformedCount(currentMonth(history).count());
        dto.setTotalMonthlyIncome(currentMonth(history).income());
        dto.setMonthlyIncomeHistory(incomes(history));
        dto.setTasksPerformedCountHistory(counts(history));
        dto.setCaregiverWorkload(buildCaregiverWorkload(deptId));
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
        List<MonthTotals> history = monthlyTotals(orgId, null, null);

        DashboardDTO dto = new DashboardDTO();
        dto.setClientCount((int) clientRepository.countByActiveTrueAndOrganizationId(orgId));
        dto.setEmployeeCount((int) employeeRepository.countByActiveTrueAndOrganizationId(orgId));
        dto.setDepartmentCount((int) departmentRepository.countByActiveTrueAndOrganizationId(orgId));
        dto.setTasksPerformedCount(currentMonth(history).count());
        dto.setTotalMonthlyIncome(currentMonth(history).income());
        dto.setMonthlyIncomeHistory(incomes(history));
        dto.setTasksPerformedCountHistory(counts(history));
        dto.setRecentPerformedTasks(performedTaskMapper.toSummaryDTOList(
                performedTaskRepository.findTop5ByOrganizationIdOrderByDateDesc(orgId)));
        dto.setTasksPerformedByDepartment(buildDepartmentTotals(orgId));
        dto.setClientIPUpdates(dashboardMapper.toClientIPUpdateDTOList(
                individualPlanRepository.findUpcomingUpdatesByOrganization(orgId, planUpdateHorizon())));
        fillClientsWithoutRecentRecords(dto, clientRepository.findByActiveTrueAndOrganizationId(orgId));
        return dto;
    }

    /** Builds the SUPERADMIN overview across all organizations. Only counts, never client names or details. */
    private DashboardDTO buildSuperadminDashboard() {
        List<MonthTotals> history = monthlyTotals(null, null, null);
        Map<Long, Integer> tasksThisMonthByOrganization = new HashMap<>();
        for (Object[] row : performedTaskRepository.countByOrganization(monthStart(), monthEnd())) {
            tasksThisMonthByOrganization.put(((Number) row[0]).longValue(), ((Number) row[1]).intValue());
        }
        Map<Long, LocalDateTime> lastActivityByOrganization = toDateMap(performedTaskRepository.findLastActivityByOrganization());

        List<OrganizationOverviewDTO> organizations = organizationRepository.findByActive(true).stream()
                .map(org -> new OrganizationOverviewDTO(
                        org.getId(),
                        org.getName(),
                        (int) departmentRepository.countByActiveTrueAndOrganizationId(org.getId()),
                        (int) employeeRepository.countByActiveTrueAndOrganizationId(org.getId()),
                        (int) clientRepository.countByActiveTrueAndOrganizationId(org.getId()),
                        tasksThisMonthByOrganization.getOrDefault(org.getId(), 0),
                        lastActivityByOrganization.get(org.getId())))
                .sorted(Comparator.comparing(OrganizationOverviewDTO::getTasksThisMonth).reversed())
                .toList();

        Map<String, Long> activeUsersByRole = new LinkedHashMap<>();
        for (UserRole role : UserRole.values()) {
            activeUsersByRole.put(role.name(), userRepository.countByRoleAndActiveTrue(role));
        }

        PlatformOverviewDTO platform = new PlatformOverviewDTO(
                organizations.size(),
                (int) departmentRepository.countByActiveTrue(),
                (int) employeeRepository.countByActiveTrue(),
                (int) clientRepository.countByActiveTrue(),
                activeUsersByRole,
                userRepository.countByActivationTokenIsNotNullAndPasswordIsNull(),
                userRepository.countByActivationTokenIsNotNullAndPasswordIsNullAndTokenExpiryBefore(LocalDateTime.now()),
                currentMonth(history).count(),
                counts(history),
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
    private List<CaregiverWorkloadDTO> buildCaregiverWorkload(Long deptId) {
        Map<Long, Object[]> totals = new HashMap<>();
        for (Object[] row : performedTaskRepository.sumByCaregiver(deptId, monthStart(), monthEnd())) {
            totals.put(((Number) row[0]).longValue(), row);
        }
        return employeeRepository.findByActiveTrueAndDepartmentId(deptId).stream()
                .filter(e -> e.getRole() == EmployeeRole.CAREGIVER)
                .map(e -> {
                    Object[] row = totals.get(e.getId());
                    int tasks = row == null ? 0 : ((Number) row[1]).intValue();
                    int minutes = row == null ? 0 : ((Number) row[2]).intValue();
                    return new CaregiverWorkloadDTO(e.getId(), e.getFullName(), tasks, minutes);
                })
                .sorted(Comparator.comparing(CaregiverWorkloadDTO::getTasksCount).reversed())
                .toList();
    }

    /** Task count and income per department of the organization this month, busiest first. */
    private List<DepartmentPerformedTasksDTO> buildDepartmentTotals(Long orgId) {
        return performedTaskRepository.sumByDepartment(orgId, monthStart(), monthEnd()).stream()
                .map(row -> new DepartmentPerformedTasksDTO(
                        (String) row[0], ((Number) row[1]).intValue(), ((Number) row[2]).intValue()))
                .sorted(Comparator.comparing(DepartmentPerformedTasksDTO::getPerformedTasksCount).reversed())
                .toList();
    }

    /** Task count and income of one month. */
    private record MonthTotals(int count, int income) {
    }

    /**
     * Returns 12 monthly totals, oldest month first (current month last), summed in the database.
     * Scope parameters are optional; all null means the whole application.
     */
    private List<MonthTotals> monthlyTotals(Long organizationId, Long departmentId, Long caregiverId) {
        Map<YearMonth, MonthTotals> byMonth = new HashMap<>();
        for (Object[] row : performedTaskRepository.sumByMonth(
                twelveMonthsStart(), monthEnd(), organizationId, departmentId, caregiverId)) {
            YearMonth month = YearMonth.of(((Number) row[0]).intValue(), ((Number) row[1]).intValue());
            byMonth.put(month, new MonthTotals(((Number) row[2]).intValue(), ((Number) row[3]).intValue()));
        }
        List<MonthTotals> history = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            history.add(byMonth.getOrDefault(YearMonth.now().minusMonths(i), new MonthTotals(0, 0)));
        }
        return history;
    }

    private MonthTotals currentMonth(List<MonthTotals> history) {
        return history.get(history.size() - 1);
    }

    private List<Integer> counts(List<MonthTotals> history) {
        return history.stream().map(MonthTotals::count).toList();
    }

    private List<Integer> incomes(List<MonthTotals> history) {
        return history.stream().map(MonthTotals::income).toList();
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

    /** Unit count of HOUR tasks is stored in minutes; other unit types do not count towards time. */
    private int minutesOf(PerformedTask task) {
        return task.getTask().getUnitType() == UnitType.HOUR ? task.getUnitCount().intValue() : 0;
    }

    private Integer calculateTotalMinutes(List<PerformedTask> tasks) {
        return tasks.stream().mapToInt(this::minutesOf).sum();
    }
}
