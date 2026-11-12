package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.UnitType;
import cz.zcu.kiv.caretracker.support.AbstractRepositoryTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.entry;

/**
 * Dashboard aggregations and "last record" queries of {@link PerformedTaskRepository} (native SQL on PostgreSQL).
 * Income must equal the sum of {@link PerformedTask#calculatePrice()}, i.e. each record rounded half up on its own
 * before summing. The dashboard view through HTTP is covered by {@code DashboardTotalsIT}; here the halfway cases
 * of rounding, the half-open [start, end) range and the optional scope parameters.
 */
class PerformedTaskRepositoryIT extends AbstractRepositoryTest {

    private static final LocalDateTime NOVEMBER = LocalDateTime.of(2026, 11, 1, 0, 0);
    private static final LocalDateTime DECEMBER = LocalDateTime.of(2026, 12, 1, 0, 0);
    private static final LocalDateTime JANUARY = LocalDateTime.of(2027, 1, 1, 0, 0);
    private static final LocalDateTime FEBRUARY = LocalDateTime.of(2027, 2, 1, 0, 0);

    /** PostgreSQL stores microseconds; a nanosecond more would be rounded up to the next month. */
    private static final int LAST_MICROSECOND = 999_999_000;

    @Autowired
    private PerformedTaskRepository performedTaskRepository;

    private Organization organization;
    private Department department;
    private Department otherDepartment;
    private Employee caregiver;
    private Employee coCaregiver;
    private Client client;
    private Client otherDepartmentClient;
    private Organization otherOrganization;
    private Client otherOrganizationClient;
    private Task otherOrganizationTask;

    /** 150 per hour, recorded in minutes. */
    private Task hourly;
    private Task visit;

    @BeforeEach
    void createOrganizations() {
        organization = testData.organization();
        department = testData.department(organization);
        otherDepartment = testData.department(organization);
        caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        coCaregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        client = testData.client(caregiver);
        otherDepartmentClient = testData.client(testData.employee(otherDepartment, EmployeeRole.CAREGIVER));
        hourly = testData.task(organization, UnitType.HOUR, 150);
        visit = testData.task(organization, UnitType.OCCURRENCE, 40);

        otherOrganization = testData.organization();
        otherOrganizationClient = testData.client(testData.employee(testData.department(otherOrganization), EmployeeRole.CAREGIVER));
        otherOrganizationTask = testData.task(otherOrganization, UnitType.OCCURRENCE, 100);
    }

    @Test
    void incomeRoundsEveryRecordHalfUpLikeCalculatePrice() {
        Task perKilogram = testData.task(organization, UnitType.KG, 50);
        Task perKilometre = testData.task(organization, UnitType.KM, 7);
        Task hundredPerHour = testData.task(organization, UnitType.HOUR, 100);
        LocalDateTime day = LocalDateTime.of(2026, 11, 10, 8, 0);
        // 0.29 * 50 = 14.5, in double arithmetic 14.4999... which would round down
        testData.performedTask(client, perKilogram, day, 0.29);
        // 7.5 min * 150 / 60 = 18.75
        testData.performedTask(client, hourly, day, 7.5);
        // 1 min * 150 / 60 = 2.5 twice: rounded per record 3 + 3, not 5 for the sum
        testData.performedTask(client, hourly, day, 1);
        testData.performedTask(client, hourly, day, 1);
        // 7.5 min * 100 / 60 = 12.5
        testData.performedTask(client, hundredPerHour, day, 7.5);
        // 2.5 km * 7 = 17.5
        testData.performedTask(client, perKilometre, day, 2.5);
        testData.performedTask(client, visit, day, 3);
        flushAndClear();

        int sumOfCalculatedPrices = performedTaskRepository.findAll().stream().mapToInt(PerformedTask::calculatePrice).sum();
        Object[] november = single(performedTaskRepository.sumByMonth(NOVEMBER, DECEMBER, organization.getId(), null, null));
        Object[] departmentRow = single(performedTaskRepository.sumByDepartment(organization.getId(), NOVEMBER, DECEMBER));

        assertThat(sumOfCalculatedPrices).isEqualTo(15 + 19 + 3 + 3 + 13 + 18 + 120);
        assertThat(intAt(november, 2)).isEqualTo(7);
        assertThat(intAt(november, 3)).isEqualTo(sumOfCalculatedPrices);
        assertThat(intAt(departmentRow, 2)).isEqualTo(sumOfCalculatedPrices);
    }

    @Test
    void monthsAreGroupedAcrossTheYearTurnWithinAHalfOpenRange() {
        testData.performedTask(client, visit, DECEMBER.minusNanos(1000), 1);
        testData.performedTask(client, visit, DECEMBER, 1);
        testData.performedTask(client, hourly, LocalDateTime.of(2026, 12, 31, 23, 59, 59, LAST_MICROSECOND), 30);
        testData.performedTask(client, hourly, JANUARY, 60);
        testData.performedTask(client, visit, LocalDateTime.of(2027, 1, 31, 23, 59, 59, LAST_MICROSECOND), 2);
        testData.performedTask(client, visit, FEBRUARY, 1);
        flushAndClear();

        Map<YearMonth, List<Integer>> totals = byMonth(performedTaskRepository.sumByMonth(DECEMBER, FEBRUARY, null, null, null));

        assertThat(totals).containsOnly(
                entry(YearMonth.of(2026, 12), List.of(2, 40 + 75)),
                entry(YearMonth.of(2027, 1), List.of(2, 150 + 80)));
    }

    @Test
    void monthTotalsAreLimitedByOptionalScope() {
        testData.performedTask(client, visit, NOVEMBER.plusDays(1), 1, coCaregiver);
        testData.performedTask(client, visit, NOVEMBER.plusDays(2), 2);
        testData.performedTask(otherDepartmentClient, visit, NOVEMBER.plusDays(3), 4);
        testData.performedTask(otherOrganizationClient, otherOrganizationTask, NOVEMBER.plusDays(4), 1);
        flushAndClear();

        assertThat(novemberTotals(null, null, null)).containsExactly(4, 40 + 80 + 160 + 100);
        assertThat(novemberTotals(organization.getId(), null, null)).containsExactly(3, 40 + 80 + 160);
        assertThat(novemberTotals(organization.getId(), department.getId(), null)).containsExactly(2, 40 + 80);
        // the record of two caregivers is one record, also when filtered by either of them
        assertThat(novemberTotals(null, null, caregiver.getId())).containsExactly(2, 40 + 80);
        assertThat(novemberTotals(null, null, coCaregiver.getId())).containsExactly(1, 40);
        assertThat(novemberTotals(otherOrganization.getId(), department.getId(), null)).isEmpty();
    }

    @Test
    void caregiverTotalsCountSharedRecordForEachCaregiverAndOnlyMinutesOfHourTasks() {
        testData.performedTask(client, hourly, NOVEMBER, 7.5, coCaregiver);
        testData.performedTask(client, hourly, NOVEMBER.plusDays(1), 7.5);
        testData.performedTask(client, visit, NOVEMBER.plusDays(2), 3);
        testData.performedTask(client, hourly, DECEMBER, 60);
        testData.performedTask(client, hourly, NOVEMBER.minusNanos(1000), 60);
        testData.performedTask(otherDepartmentClient, hourly, NOVEMBER.plusDays(3), 60);
        flushAndClear();

        Map<Long, Object[]> totals = byId(performedTaskRepository.sumByCaregiver(department.getId(), NOVEMBER, DECEMBER));

        assertThat(totals).containsOnlyKeys(caregiver.getId(), coCaregiver.getId());
        assertThat(intAt(totals.get(caregiver.getId()), 1)).isEqualTo(3);
        assertThat(decimalAt(totals.get(caregiver.getId()), 2)).isEqualTo(15.0);
        assertThat(intAt(totals.get(coCaregiver.getId()), 1)).isEqualTo(1);
        assertThat(decimalAt(totals.get(coCaregiver.getId()), 2)).isEqualTo(7.5);
    }

    @Test
    void departmentTotalsAreSeparateForDepartmentsInTheSameCity() {
        testData.performedTask(client, hourly, NOVEMBER, 1);
        testData.performedTask(client, visit, NOVEMBER.plusDays(1), 1);
        testData.performedTask(otherDepartmentClient, hourly, NOVEMBER.plusDays(2), 1);
        testData.performedTask(otherDepartmentClient, hourly, DECEMBER, 60);
        testData.performedTask(otherOrganizationClient, otherOrganizationTask, NOVEMBER.plusDays(3), 1);
        flushAndClear();

        List<Object[]> rows = performedTaskRepository.sumByDepartment(organization.getId(), NOVEMBER, DECEMBER);

        assertThat(department.getCity()).isEqualTo(otherDepartment.getCity());
        assertThat(rows).extracting(row -> row[0]).containsOnly(department.getCity());
        assertThat(rows).extracting(row -> List.of(intAt(row, 1), intAt(row, 2)))
                .containsExactlyInAnyOrder(List.of(2, 3 + 40), List.of(1, 3));
    }

    @Test
    void organizationCountsUseTheHalfOpenRange() {
        testData.performedTask(client, visit, NOVEMBER, 1);
        testData.performedTask(otherDepartmentClient, visit, DECEMBER.minusNanos(1000), 1, coCaregiver);
        testData.performedTask(client, visit, DECEMBER, 1);
        testData.performedTask(otherOrganizationClient, otherOrganizationTask, NOVEMBER.plusDays(5), 1);
        flushAndClear();

        Map<Long, Object[]> counts = byId(performedTaskRepository.countByOrganization(NOVEMBER, DECEMBER));

        assertThat(counts).containsOnlyKeys(organization.getId(), otherOrganization.getId());
        assertThat(intAt(counts.get(organization.getId()), 1)).isEqualTo(2);
        assertThat(intAt(counts.get(otherOrganization.getId()), 1)).isEqualTo(1);
    }

    @Test
    void lastActivityIsTheLatestRecordOfEachOrganization() {
        LocalDateTime latest = LocalDateTime.of(2027, 1, 1, 0, 0);
        LocalDateTime otherOrganizationLatest = LocalDateTime.of(2026, 6, 1, 12, 0);
        testData.performedTask(client, visit, NOVEMBER, 1);
        testData.performedTask(otherDepartmentClient, visit, latest, 1);
        testData.performedTask(otherOrganizationClient, otherOrganizationTask, otherOrganizationLatest, 1);
        flushAndClear();

        Map<Long, Object[]> lastActivity = byId(performedTaskRepository.findLastActivityByOrganization());

        assertThat(lastActivity).containsOnlyKeys(organization.getId(), otherOrganization.getId());
        assertThat(lastActivity.get(organization.getId())[1]).isEqualTo(latest);
        assertThat(lastActivity.get(otherOrganization.getId())[1]).isEqualTo(otherOrganizationLatest);
    }

    private List<Integer> novemberTotals(Long organizationId, Long departmentId, Long caregiverId) {
        List<Object[]> rows = performedTaskRepository.sumByMonth(NOVEMBER, DECEMBER, organizationId, departmentId, caregiverId);
        return rows.isEmpty() ? List.of() : List.of(intAt(single(rows), 2), intAt(single(rows), 3));
    }

    private static Map<YearMonth, List<Integer>> byMonth(List<Object[]> rows) {
        return rows.stream().collect(Collectors.toMap(
                row -> YearMonth.of(intAt(row, 0), intAt(row, 1)),
                row -> List.of(intAt(row, 2), intAt(row, 3))));
    }

    private static Map<Long, Object[]> byId(List<Object[]> rows) {
        return rows.stream().collect(Collectors.toMap(row -> ((Number) row[0]).longValue(), Function.identity()));
    }

    private static Object[] single(List<Object[]> rows) {
        assertThat(rows).hasSize(1);
        return rows.getFirst();
    }

    private static int intAt(Object[] row, int column) {
        return ((Number) row[column]).intValue();
    }

    private static double decimalAt(Object[] row, int column) {
        return ((Number) row[column]).doubleValue();
    }
}
