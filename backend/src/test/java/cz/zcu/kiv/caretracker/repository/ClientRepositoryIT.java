package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.UnitType;
import cz.zcu.kiv.caretracker.support.AbstractRepositoryTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link ClientRepository#findWithoutRecordsSince} (native SQL on PostgreSQL): the day boundary, the optional scope
 * parameters and the limit with the total count. Order and the dashboard view are covered by {@code DashboardTotalsIT}.
 */
class ClientRepositoryIT extends AbstractRepositoryTest {

    private static final LocalDate SINCE = LocalDate.of(2026, 11, 1);
    private static final LocalDate ESTABLISHED = LocalDate.of(2026, 1, 1);
    /** PostgreSQL stores microseconds. */
    private static final int LAST_MICROSECOND = 999_999_000;

    @Autowired
    private ClientRepository clientRepository;

    private Organization organization;
    private Department department;
    private Employee caregiver;
    private Task visit;

    @BeforeEach
    void createOrganization() {
        organization = testData.organization();
        department = testData.department(organization);
        caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        visit = testData.task(organization, UnitType.OCCURRENCE, 40);
    }

    @Test
    void clientIsListedOnlyWhenItsLatestRecordIsBeforeTheDay() {
        LocalDateTime lastMomentBefore = SINCE.minusDays(1).atTime(23, 59, 59, LAST_MICROSECOND);
        Client recordJustBefore = establishedClient(caregiver);
        testData.performedTask(recordJustBefore, visit, SINCE.minusMonths(1).atTime(8, 0), 1);
        testData.performedTask(recordJustBefore, visit, lastMomentBefore, 1);
        Client recordAtMidnight = establishedClient(caregiver);
        testData.performedTask(recordAtMidnight, visit, SINCE.minusMonths(1).atTime(8, 0), 1);
        testData.performedTask(recordAtMidnight, visit, SINCE.atStartOfDay(), 1);
        Client createdOnTheDay = clientCreatedOn(caregiver, SINCE);
        Client createdTheDayBefore = clientCreatedOn(caregiver, SINCE.minusDays(1));
        flushAndClear();

        List<Object[]> rows = clientRepository.findWithoutRecordsSince(SINCE, 10, null, null, null);

        assertThat(rows).extracting(row -> ((Number) row[0]).longValue())
                .containsExactly(createdTheDayBefore.getId(), recordJustBefore.getId())
                .doesNotContain(recordAtMidnight.getId(), createdOnTheDay.getId());
        assertThat(rows.get(1)[1]).isEqualTo(recordJustBefore.getFullName());
        assertThat(rows.get(1)[2]).isEqualTo(lastMomentBefore);
        assertThat(rows.get(0)[2]).isNull();
    }

    @Test
    void inactiveClientsAreNotListed() {
        Client former = establishedClient(caregiver);
        former.setActive(false);
        clientRepository.save(former);
        flushAndClear();

        assertThat(clientRepository.findWithoutRecordsSince(SINCE, 10, null, null, null)).isEmpty();
    }

    @Test
    void scopeParametersRestrictTheClients() {
        Client ofCaregiver = establishedClient(caregiver);
        Client ofColleague = establishedClient(testData.employee(department, EmployeeRole.CAREGIVER));
        Client ofOtherDepartment = establishedClient(testData.employee(testData.department(organization), EmployeeRole.CAREGIVER));
        Organization otherOrganization = testData.organization();
        Client ofOtherOrganization = establishedClient(testData.employee(testData.department(otherOrganization), EmployeeRole.CAREGIVER));
        flushAndClear();

        assertThat(clientIds(organization.getId(), null, null))
                .containsExactlyInAnyOrder(ofCaregiver.getId(), ofColleague.getId(), ofOtherDepartment.getId());
        assertThat(clientIds(null, department.getId(), null)).containsExactlyInAnyOrder(ofCaregiver.getId(), ofColleague.getId());
        assertThat(clientIds(null, null, caregiver.getId())).containsExactly(ofCaregiver.getId());
        assertThat(clientIds(null, null, null)).contains(ofOtherOrganization.getId()).hasSize(4);
    }

    @Test
    void limitShortensTheListButEveryRowCarriesTheTotalCount() {
        for (int i = 0; i < 4; i++) {
            establishedClient(caregiver);
        }
        flushAndClear();

        List<Object[]> rows = clientRepository.findWithoutRecordsSince(SINCE, 3, null, null, null);

        assertThat(rows).hasSize(3);
        assertThat(rows).extracting(row -> ((Number) row[3]).intValue()).containsOnly(4);
    }

    private List<Long> clientIds(Long organizationId, Long departmentId, Long caregiverId) {
        return clientRepository.findWithoutRecordsSince(SINCE, 10, organizationId, departmentId, caregiverId).stream()
                .map(row -> ((Number) row[0]).longValue())
                .toList();
    }

    private Client establishedClient(Employee clientCaregiver) {
        return clientCreatedOn(clientCaregiver, ESTABLISHED);
    }

    private Client clientCreatedOn(Employee clientCaregiver, LocalDate created) {
        Client client = testData.client(clientCaregiver);
        client.setCreated(created);
        return clientRepository.save(client);
    }
}
