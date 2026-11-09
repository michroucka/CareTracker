package cz.zcu.kiv.caretracker.specification;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.PerformedTaskRepository;
import cz.zcu.kiv.caretracker.support.AbstractRepositoryTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Filters of the performed task list, receipts and exports, evaluated by PostgreSQL. Two organizations,
 * the first one with two departments; every record is created on purpose so each filter has something to leave out.
 */
class PerformedTaskSpecificationsIT extends AbstractRepositoryTest {

    /** PostgreSQL stores microseconds; a nanosecond more would be rounded up to midnight of the next day. */
    private static final int LAST_MICROSECOND = 999_999_000;

    @Autowired
    private PerformedTaskRepository performedTaskRepository;

    private Organization organization;
    private Department department;
    private Department otherDepartment;
    private Employee caregiver;
    private Employee coCaregiver;
    private Employee otherDepartmentCaregiver;
    private Client client;
    private Client secondClient;
    private Client otherDepartmentClient;
    private Client otherOrganizationClient;
    private Task task;
    private Task otherOrganizationTask;

    @BeforeEach
    void createOrganizations() {
        organization = testData.organization();
        department = testData.department(organization);
        otherDepartment = testData.department(organization);
        caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        coCaregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        otherDepartmentCaregiver = testData.employee(otherDepartment, EmployeeRole.CAREGIVER);
        client = testData.client(caregiver);
        secondClient = testData.client(coCaregiver);
        otherDepartmentClient = testData.client(otherDepartmentCaregiver);
        task = testData.task(organization);

        Organization otherOrganization = testData.organization();
        Employee otherOrganizationCaregiver = testData.employee(testData.department(otherOrganization), EmployeeRole.CAREGIVER);
        otherOrganizationClient = testData.client(otherOrganizationCaregiver);
        otherOrganizationTask = testData.task(otherOrganization);
    }

    @Test
    void monthRunsFromItsFirstMomentToItsLastMicrosecond() {
        PerformedTask firstMoment = record(LocalDateTime.of(2026, 12, 1, 0, 0));
        PerformedTask lastMoment = record(LocalDateTime.of(2026, 12, 31, 23, 59, 59, LAST_MICROSECOND));
        record(LocalDateTime.of(2026, 11, 30, 23, 59, 59, LAST_MICROSECOND));
        record(LocalDateTime.of(2027, 1, 1, 0, 0));

        assertThat(ids(PerformedTaskSpecifications.hasDateInMonth(12, 2026)))
                .containsExactlyInAnyOrder(firstMoment.getId(), lastMoment.getId());
    }

    @Test
    void recordAtMidnightBelongsToTheMonthThatStarts() {
        PerformedTask newYearMidnight = record(LocalDateTime.of(2027, 1, 1, 0, 0));

        assertThat(ids(PerformedTaskSpecifications.hasDateInMonth(1, 2027))).containsExactly(newYearMidnight.getId());
        assertThat(ids(PerformedTaskSpecifications.hasDateInMonth(12, 2026))).isEmpty();
    }

    @Test
    void decemberAndJanuaryAreTakenFromTheRequestedYear() {
        PerformedTask december2026 = record(LocalDateTime.of(2026, 12, 15, 8, 0));
        PerformedTask january2027 = record(LocalDateTime.of(2027, 1, 15, 8, 0));
        record(LocalDateTime.of(2025, 12, 15, 8, 0));
        record(LocalDateTime.of(2026, 1, 15, 8, 0));

        assertThat(ids(PerformedTaskSpecifications.hasDateInMonth(12, 2026))).containsExactly(december2026.getId());
        assertThat(ids(PerformedTaskSpecifications.hasDateInMonth(1, 2027))).containsExactly(january2027.getId());
    }

    @Test
    void februaryOfLeapYearEndsAfterTheTwentyNinth() {
        PerformedTask leapDay = record(LocalDateTime.of(2028, 2, 29, 23, 59, 59, LAST_MICROSECOND));
        record(LocalDateTime.of(2028, 3, 1, 0, 0));

        assertThat(ids(PerformedTaskSpecifications.hasDateInMonth(2, 2028))).containsExactly(leapDay.getId());
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 13})
    void monthOutsideOneToTwelveDoesNotFilter(int month) {
        record(LocalDateTime.of(2026, 12, 15, 8, 0));
        record(LocalDateTime.of(2027, 1, 15, 8, 0));

        assertThat(ids(PerformedTaskSpecifications.hasDateInMonth(month, 2026))).hasSize(2);
    }

    @Test
    void withoutFiltersReturnsRecordsOfAllOrganizations() {
        record(client, LocalDateTime.of(2026, 11, 2, 9, 0));
        record(otherDepartmentClient, LocalDateTime.of(2026, 11, 2, 9, 0));
        testData.performedTask(otherOrganizationClient, otherOrganizationTask, LocalDateTime.of(2026, 11, 2, 9, 0));

        assertThat(ids(PerformedTaskSpecifications.withFilters(null, null, null, null, null, null))).hasSize(3);
    }

    @Test
    void emptyListsMeanNoFilter() {
        record(client, LocalDateTime.of(2026, 11, 2, 9, 0));
        record(otherDepartmentClient, LocalDateTime.of(2026, 11, 2, 9, 0));

        assertThat(ids(PerformedTaskSpecifications.withFilters(organization.getId(), List.of(), List.of(), null, null, null)))
                .hasSize(2);
    }

    @Test
    void organizationFilterLeavesOutOtherOrganizations() {
        PerformedTask own = record(client, LocalDateTime.of(2026, 11, 2, 9, 0));
        testData.performedTask(otherOrganizationClient, otherOrganizationTask, LocalDateTime.of(2026, 11, 2, 9, 0));

        assertThat(ids(PerformedTaskSpecifications.withFilters(organization.getId(), null, null, null, null, null)))
                .containsExactly(own.getId());
    }

    @Test
    void departmentFilterAcceptsSeveralDepartments() {
        PerformedTask inDepartment = record(client, LocalDateTime.of(2026, 11, 2, 9, 0));
        PerformedTask inOtherDepartment = record(otherDepartmentClient, LocalDateTime.of(2026, 11, 2, 9, 0));
        testData.performedTask(otherOrganizationClient, otherOrganizationTask, LocalDateTime.of(2026, 11, 2, 9, 0));

        assertThat(ids(PerformedTaskSpecifications.withFilters(null, List.of(department.getId()), null, null, null, null)))
                .containsExactly(inDepartment.getId());
        assertThat(ids(PerformedTaskSpecifications.withFilters(
                null, List.of(department.getId(), otherDepartment.getId()), null, null, null, null)))
                .containsExactlyInAnyOrder(inDepartment.getId(), inOtherDepartment.getId());
    }

    @Test
    void caregiverFilterMatchesCoCaregiverToo() {
        PerformedTask withCoCaregiver = testData.performedTask(client, task, LocalDateTime.of(2026, 11, 2, 9, 0), 60, coCaregiver);
        PerformedTask ofCoCaregiversClient = record(secondClient, LocalDateTime.of(2026, 11, 3, 9, 0));
        record(client, LocalDateTime.of(2026, 11, 4, 9, 0));

        assertThat(ids(PerformedTaskSpecifications.withFilters(null, null, List.of(coCaregiver.getId()), null, null, null)))
                .containsExactlyInAnyOrder(withCoCaregiver.getId(), ofCoCaregiversClient.getId());
    }

    @Test
    void recordOfTwoSelectedCaregiversIsReturnedOnce() {
        PerformedTask withCoCaregiver = testData.performedTask(client, task, LocalDateTime.of(2026, 11, 2, 9, 0), 60, coCaregiver);
        flushAndClear();

        List<PerformedTask> found = performedTaskRepository.findAll(PerformedTaskSpecifications.withFilters(
                null, null, List.of(caregiver.getId(), coCaregiver.getId()), null, null, null));

        assertThat(found).extracting(PerformedTask::getId).containsExactly(withCoCaregiver.getId());
    }

    @Test
    void clientFilterLeavesOutOtherClients() {
        PerformedTask ofClient = record(client, LocalDateTime.of(2026, 11, 2, 9, 0));
        record(secondClient, LocalDateTime.of(2026, 11, 2, 9, 0));

        assertThat(ids(PerformedTaskSpecifications.withFilters(null, null, null, client.getId(), null, null)))
                .containsExactly(ofClient.getId());
    }

    @Test
    void filtersCombineWithAnd() {
        PerformedTask matching = testData.performedTask(client, task, LocalDateTime.of(2026, 11, 2, 9, 0), 60, coCaregiver);
        record(client, LocalDateTime.of(2026, 11, 3, 9, 0));
        testData.performedTask(client, task, LocalDateTime.of(2026, 10, 31, 9, 0), 60, coCaregiver);
        record(secondClient, LocalDateTime.of(2026, 11, 4, 9, 0));
        record(otherDepartmentClient, LocalDateTime.of(2026, 11, 5, 9, 0));

        Specification<PerformedTask> filters = PerformedTaskSpecifications.withFilters(
                organization.getId(), List.of(department.getId()), List.of(coCaregiver.getId()), client.getId(), 11, 2026);

        assertThat(ids(filters)).containsExactly(matching.getId());
    }

    @Test
    void departmentOfAnotherOrganizationGivesNothing() {
        record(client, LocalDateTime.of(2026, 11, 2, 9, 0));
        Department foreignDepartment = otherOrganizationClient.getDepartment();

        assertThat(ids(PerformedTaskSpecifications.withFilters(
                organization.getId(), List.of(foreignDepartment.getId()), null, null, null, null))).isEmpty();
    }

    private PerformedTask record(LocalDateTime date) {
        return record(client, date);
    }

    private PerformedTask record(Client recordClient, LocalDateTime date) {
        return testData.performedTask(recordClient, task, date);
    }

    private List<Long> ids(Specification<PerformedTask> specification) {
        flushAndClear();
        return performedTaskRepository.findAll(specification).stream().map(PerformedTask::getId).toList();
    }
}
