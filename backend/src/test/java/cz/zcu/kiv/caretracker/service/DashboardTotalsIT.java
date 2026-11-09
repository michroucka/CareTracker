package cz.zcu.kiv.caretracker.service;

import com.jayway.jsonpath.JsonPath;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.UnitType;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Dashboard figures that depend on "today": totals of the current month, the 12-month history, today's work
 * and the attention lists. The clock stands on 15 January 2027, so the history crosses the year turn
 * (February 2026 to January 2027) and month boundaries fall on 1 January and 1 February 2027.
 */
class DashboardTotalsIT extends AbstractIntegrationTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2027, 1, 15, 10, 0);
    private static final LocalDate TODAY = NOW.toLocalDate();

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private UserRepository userRepository;

    private Organization organization;
    private Department department;
    private Department otherDepartment;
    private Employee admin;
    private Employee coordinator;
    private Employee caregiver;
    private Employee coCaregiver;
    private Client client;

    /** 150 per hour, recorded in minutes. */
    private Task hourly;
    /** 40 per visit. */
    private Task visit;
    /** 7 per kilometre. */
    private Task ride;

    @BeforeEach
    void createOrganization() {
        clock.fixAt(NOW);
        organization = testData.organization();
        department = testData.department(organization);
        otherDepartment = testData.department(organization);
        admin = testData.employee(department, EmployeeRole.MANAGER);
        coordinator = testData.employee(department, EmployeeRole.COORDINATOR);
        caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        coCaregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        client = clientCreatedOn(TODAY);
        hourly = testData.task(organization, UnitType.HOUR, 150);
        visit = testData.task(organization, UnitType.OCCURRENCE, 40);
        ride = testData.task(organization, UnitType.KM, 7);
    }

    @Test
    void currentMonthRunsFromFirstToLastMomentOfTheMonth() throws Exception {
        testData.performedTask(client, hourly, LocalDateTime.of(2027, 1, 1, 0, 0), 60);
        testData.performedTask(client, visit, LocalDateTime.of(2027, 1, 31, 23, 59, 59), 2);
        testData.performedTask(client, hourly, LocalDateTime.of(2027, 1, 15, 8, 0), 45);
        testData.performedTask(client, hourly, LocalDateTime.of(2026, 12, 31, 23, 59, 59), 60);
        testData.performedTask(client, hourly, LocalDateTime.of(2027, 2, 1, 0, 0), 60);

        String organizationView = dashboard(admin.getUser(), "ORGANIZATION");
        String departmentView = dashboard(coordinator.getUser(), "DEPARTMENT");

        for (String dashboard : List.of(organizationView, departmentView)) {
            assertThat(JsonPath.<Integer>read(dashboard, "$.tasksPerformedCount")).isEqualTo(3);
            // 150 + 2 * 40 + 45 min * 150 / 60 = 112.5, rounded per task like PerformedTask#calculatePrice
            assertThat(JsonPath.<Integer>read(dashboard, "$.totalMonthlyIncome")).isEqualTo(343);
        }
    }

    @Test
    void historyCoversTwelveMonthsAcrossTheYearTurnOldestFirst() throws Exception {
        testData.performedTask(client, hourly, LocalDateTime.of(2026, 1, 31, 23, 59, 59), 60);
        testData.performedTask(client, hourly, LocalDateTime.of(2026, 2, 1, 0, 0), 60);
        testData.performedTask(client, visit, LocalDateTime.of(2026, 6, 10, 12, 0), 1);
        testData.performedTask(client, ride, LocalDateTime.of(2026, 12, 31, 23, 59, 59), 10);
        testData.performedTask(client, visit, LocalDateTime.of(2027, 1, 2, 8, 0), 3);
        testData.performedTask(client, hourly, LocalDateTime.of(2027, 1, 20, 8, 0), 30);
        testData.performedTask(client, hourly, LocalDateTime.of(2027, 2, 1, 0, 0), 60);

        List<Integer> expectedCounts = List.of(1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 2);
        List<Integer> expectedIncomes = List.of(150, 0, 0, 0, 40, 0, 0, 0, 0, 0, 70, 195);

        String organizationView = dashboard(admin.getUser(), "ORGANIZATION");
        assertThat(JsonPath.<List<Integer>>read(organizationView, "$.tasksPerformedCountHistory")).isEqualTo(expectedCounts);
        assertThat(JsonPath.<List<Integer>>read(organizationView, "$.monthlyIncomeHistory")).isEqualTo(expectedIncomes);

        String departmentView = dashboard(coordinator.getUser(), "DEPARTMENT");
        assertThat(JsonPath.<List<Integer>>read(departmentView, "$.tasksPerformedCountHistory")).isEqualTo(expectedCounts);
        assertThat(JsonPath.<List<Integer>>read(departmentView, "$.monthlyIncomeHistory")).isEqualTo(expectedIncomes);

        String ownView = dashboard(caregiver.getUser(), "MINE");
        assertThat(JsonPath.<List<Integer>>read(ownView, "$.tasksPerformedCountHistory")).isEqualTo(expectedCounts);
        assertThat(JsonPath.<Integer>read(ownView, "$.tasksPerformedCount")).isEqualTo(2);

        String platform = dashboard(testData.superadmin(), null);
        assertThat(JsonPath.<List<Integer>>read(platform, "$.platform.tasksHistory")).isEqualTo(expectedCounts);
        assertThat(JsonPath.<Integer>read(platform, "$.platform.tasksThisMonth")).isEqualTo(2);
    }

    @Test
    void ownWorkCountsTodayAndMinutesOfHourTasksOnly() throws Exception {
        testData.performedTask(client, hourly, TODAY.atStartOfDay(), 30);
        testData.performedTask(client, visit, TODAY.atTime(23, 59, 59), 1);
        testData.performedTask(client, hourly, TODAY.minusDays(1).atTime(23, 59, 59), 20);
        testData.performedTask(client, ride, LocalDateTime.of(2027, 1, 1, 0, 0), 5);
        testData.performedTask(client, hourly, LocalDateTime.of(2026, 12, 31, 23, 59, 59), 90);
        Client colleaguesClient = testData.client(coCaregiver);
        testData.performedTask(colleaguesClient, hourly, TODAY.atTime(9, 0), 15, caregiver);

        String dashboard = dashboard(caregiver.getUser(), "MINE");

        assertThat(JsonPath.<Integer>read(dashboard, "$.todayTasksCount")).isEqualTo(3);
        assertThat(JsonPath.<Integer>read(dashboard, "$.todayMinutes")).isEqualTo(45);
        assertThat(JsonPath.<Integer>read(dashboard, "$.tasksPerformedCount")).isEqualTo(5);
        assertThat(JsonPath.<Integer>read(dashboard, "$.totalMonthMinutes")).isEqualTo(65);
    }

    @Test
    void todayEndsBeforeMidnightOfTheNextDay() throws Exception {
        testData.performedTask(client, hourly, TODAY.plusDays(1).atStartOfDay(), 30);

        String dashboard = dashboard(caregiver.getUser(), "MINE");

        assertThat(JsonPath.<Integer>read(dashboard, "$.todayTasksCount")).isZero();
        assertThat(JsonPath.<Integer>read(dashboard, "$.todayMinutes")).isZero();
    }

    @Test
    void monthMinutesEndBeforeMidnightOfTheNextMonth() throws Exception {
        testData.performedTask(client, hourly, LocalDateTime.of(2027, 1, 31, 23, 59, 59), 30);
        testData.performedTask(client, hourly, LocalDateTime.of(2027, 2, 1, 0, 0), 60);

        String dashboard = dashboard(caregiver.getUser(), "MINE");

        assertThat(JsonPath.<Integer>read(dashboard, "$.tasksPerformedCount")).isEqualTo(1);
        assertThat(JsonPath.<Integer>read(dashboard, "$.totalMonthMinutes")).isEqualTo(30);
    }

    @Test
    void caregiverWorkloadSumsThisMonthPerCaregiverBusiestFirst() throws Exception {
        Client colleaguesClient = testData.client(coCaregiver);
        testData.performedTask(client, hourly, LocalDateTime.of(2027, 1, 5, 8, 0), 60);
        testData.performedTask(client, visit, LocalDateTime.of(2027, 1, 6, 8, 0), 1);
        testData.performedTask(client, hourly, LocalDateTime.of(2027, 1, 7, 8, 0), 30, coCaregiver);
        testData.performedTask(colleaguesClient, hourly, LocalDateTime.of(2026, 12, 20, 8, 0), 120);
        testData.performedTask(colleaguesClient, hourly, LocalDateTime.of(2027, 2, 1, 0, 0), 120);

        String dashboard = dashboard(coordinator.getUser(), "DEPARTMENT");

        assertThat(ids(dashboard, "$.caregiverWorkload[*].employeeId")).containsExactly(caregiver.getId(), coCaregiver.getId());
        assertThat(JsonPath.<List<Integer>>read(dashboard, "$.caregiverWorkload[*].tasksCount")).containsExactly(3, 1);
        assertThat(JsonPath.<List<Integer>>read(dashboard, "$.caregiverWorkload[*].minutes")).containsExactly(90, 30);
        // a task performed by two caregivers is one task of the department
        assertThat(JsonPath.<Integer>read(dashboard, "$.tasksPerformedCount")).isEqualTo(3);
    }

    @Test
    void departmentBreakdownSumsThisMonthBusiestFirst() throws Exception {
        Client otherDepartmentClient = testData.client(testData.employee(otherDepartment, EmployeeRole.CAREGIVER));
        testData.performedTask(client, hourly, LocalDateTime.of(2027, 1, 5, 8, 0), 60);
        testData.performedTask(client, visit, LocalDateTime.of(2027, 1, 6, 8, 0), 1);
        testData.performedTask(otherDepartmentClient, ride, LocalDateTime.of(2027, 1, 7, 8, 0), 10);
        testData.performedTask(otherDepartmentClient, ride, LocalDateTime.of(2026, 12, 7, 8, 0), 10);
        testData.performedTask(otherDepartmentClient, ride, LocalDateTime.of(2026, 12, 8, 8, 0), 10);

        String dashboard = dashboard(admin.getUser(), "ORGANIZATION");

        assertThat(JsonPath.<List<Integer>>read(dashboard, "$.tasksPerformedByDepartment[*].performedTasksCount")).containsExactly(2, 1);
        assertThat(JsonPath.<List<Integer>>read(dashboard, "$.tasksPerformedByDepartment[*].income")).containsExactly(190, 70);
    }

    @Test
    void platformOverviewCountsThisMonthPerOrganizationBusiestFirst() throws Exception {
        Organization otherOrganization = testData.organization();
        Employee otherOrganizationCaregiver = testData.employee(testData.department(otherOrganization), EmployeeRole.CAREGIVER);
        Client otherOrganizationClient = testData.client(otherOrganizationCaregiver);
        Task otherOrganizationTask = testData.task(otherOrganization);
        testData.performedTask(client, hourly, LocalDateTime.of(2027, 1, 5, 8, 0), 60);
        testData.performedTask(otherOrganizationClient, otherOrganizationTask, LocalDateTime.of(2027, 1, 5, 8, 0), 60);
        testData.performedTask(otherOrganizationClient, otherOrganizationTask, LocalDateTime.of(2027, 1, 6, 8, 0), 60);
        testData.performedTask(otherOrganizationClient, otherOrganizationTask, LocalDateTime.of(2026, 12, 6, 8, 0), 60);

        String dashboard = dashboard(testData.superadmin(), null);

        assertThat(ids(dashboard, "$.platform.organizations[*].id")).containsExactly(otherOrganization.getId(), organization.getId());
        assertThat(JsonPath.<List<Integer>>read(dashboard, "$.platform.organizations[*].tasksThisMonth")).containsExactly(2, 1);
        assertThat(JsonPath.<Integer>read(dashboard, "$.platform.tasksThisMonth")).isEqualTo(3);
    }

    @Test
    void activationIsExpiredOnlyAfterItsDeadline() throws Exception {
        withActivationDeadline(testData.employee(department, EmployeeRole.CAREGIVER), NOW.minusMinutes(1));
        withActivationDeadline(testData.employee(department, EmployeeRole.CAREGIVER), NOW.plusMinutes(1));

        String dashboard = dashboard(testData.superadmin(), null);

        assertThat(JsonPath.<Integer>read(dashboard, "$.platform.pendingActivationCount")).isEqualTo(2);
        assertThat(JsonPath.<Integer>read(dashboard, "$.platform.expiredActivationCount")).isEqualTo(1);
    }

    @Test
    void clientsWithoutRecordForFourteenDaysAreListedLongestFirst() throws Exception {
        Client recordFourteenDaysAgo = establishedClient();
        testData.performedTask(recordFourteenDaysAgo, visit, TODAY.minusDays(14).atStartOfDay(), 1);
        Client recordFifteenDaysAgo = establishedClient();
        testData.performedTask(recordFifteenDaysAgo, visit, TODAY.minusDays(15).atTime(23, 59, 59), 1);
        Client recordTwoMonthsAgo = establishedClient();
        testData.performedTask(recordTwoMonthsAgo, visit, TODAY.minusMonths(2).atTime(8, 0), 1);
        Client recordYesterday = establishedClient();
        testData.performedTask(recordYesterday, visit, TODAY.minusDays(1).atTime(8, 0), 1);
        Client neverRecorded = clientCreatedOn(TODAY.minusDays(15));
        clientCreatedOn(TODAY.minusDays(14));

        for (String dashboard : List.of(
                dashboard(caregiver.getUser(), "MINE"),
                dashboard(coordinator.getUser(), "DEPARTMENT"),
                dashboard(admin.getUser(), "ORGANIZATION"))) {
            assertThat(ids(dashboard, "$.clientsWithoutRecentRecords[*].clientId"))
                    .containsExactly(neverRecorded.getId(), recordTwoMonthsAgo.getId(), recordFifteenDaysAgo.getId());
            assertThat(JsonPath.<Integer>read(dashboard, "$.clientsWithoutRecentRecordsCount")).isEqualTo(3);
        }
    }

    @Test
    void attentionListShowsSixClientsButCountsAll() throws Exception {
        for (int i = 0; i < 8; i++) {
            establishedClient();
        }

        String dashboard = dashboard(caregiver.getUser(), "MINE");

        assertThat(ids(dashboard, "$.clientsWithoutRecentRecords[*].clientId")).hasSize(6);
        assertThat(JsonPath.<Integer>read(dashboard, "$.clientsWithoutRecentRecordsCount")).isEqualTo(8);
    }

    @Test
    void plansDueWithinThirtyDaysAreListedSoonestFirst() throws Exception {
        Client dueInThirtyDays = establishedClient();
        testData.individualPlan(dueInThirtyDays, TODAY.plusDays(30));
        Client overdue = establishedClient();
        testData.individualPlan(overdue, LocalDate.of(2026, 12, 1));
        testData.individualPlan(establishedClient(), TODAY.plusDays(31));

        for (String dashboard : List.of(
                dashboard(caregiver.getUser(), "MINE"),
                dashboard(coordinator.getUser(), "DEPARTMENT"),
                dashboard(admin.getUser(), "ORGANIZATION"))) {
            assertThat(ids(dashboard, "$.clientIPUpdates[*].clientId")).containsExactly(overdue.getId(), dueInThirtyDays.getId());
        }
    }

    private Client establishedClient() {
        return clientCreatedOn(LocalDate.of(2026, 6, 1));
    }

    private Client clientCreatedOn(LocalDate created) {
        Client newClient = testData.client(caregiver);
        newClient.setCreated(created);
        return clientRepository.save(newClient);
    }

    private void withActivationDeadline(Employee employee, LocalDateTime deadline) {
        User account = testData.withPendingAccount(employee).getUser();
        account.setPassword(null);
        account.setTokenExpiry(deadline);
        userRepository.save(account);
    }

    private String dashboard(User account, String view) throws Exception {
        var request = get("/api/dashboard").with(loggedInAs(account));
        if (view != null) {
            request.param("view", view);
        }
        return mockMvc.perform(request)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    private static List<Long> ids(String json, String path) {
        List<Number> values = JsonPath.read(json, path);
        return values.stream().map(Number::longValue).toList();
    }
}
