package cz.zcu.kiv.caretracker.specification;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.support.AbstractRepositoryTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Filters of the client list evaluated by PostgreSQL: organization, status, departments and caregivers.
 * Who may use which filter is covered by {@code ClientListAccessIT}; here only what each filter selects.
 */
class ClientSpecificationsIT extends AbstractRepositoryTest {

    @Autowired
    private ClientRepository clientRepository;

    private Organization organization;
    private Department department;
    private Department otherDepartment;
    private Employee caregiver;
    private Employee otherCaregiver;
    private Client active;
    private Client terminated;
    private Client ofOtherCaregiver;
    private Client inOtherDepartment;
    private Client inOtherOrganization;

    @BeforeEach
    void createClients() {
        organization = testData.organization();
        department = testData.department(organization);
        otherDepartment = testData.department(organization);
        caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        otherCaregiver = testData.employee(department, EmployeeRole.CAREGIVER);

        active = testData.client(caregiver);
        terminated = testData.client(caregiver);
        terminated.setActive(false);
        terminated = clientRepository.save(terminated);
        ofOtherCaregiver = testData.client(otherCaregiver);
        inOtherDepartment = testData.client(testData.employee(otherDepartment, EmployeeRole.CAREGIVER));

        Organization otherOrganization = testData.organization();
        inOtherOrganization = testData.client(testData.employee(testData.department(otherOrganization), EmployeeRole.CAREGIVER));
    }

    @Test
    void withoutFiltersReturnsActiveAndInactiveClientsOfAllOrganizations() {
        assertThat(ids(ClientSpecifications.withFilters(null, null, null, null)))
                .containsExactlyInAnyOrder(active.getId(), terminated.getId(), ofOtherCaregiver.getId(),
                        inOtherDepartment.getId(), inOtherOrganization.getId());
    }

    @Test
    void emptyListsMeanNoFilter() {
        assertThat(ids(ClientSpecifications.withFilters(organization.getId(), null, List.of(), List.of())))
                .containsExactlyInAnyOrder(active.getId(), terminated.getId(), ofOtherCaregiver.getId(), inOtherDepartment.getId());
    }

    @Test
    void statusSelectsActiveOrTerminatedClients() {
        assertThat(ids(ClientSpecifications.withFilters(organization.getId(), true, null, null)))
                .containsExactlyInAnyOrder(active.getId(), ofOtherCaregiver.getId(), inOtherDepartment.getId());
        assertThat(ids(ClientSpecifications.withFilters(organization.getId(), false, null, null)))
                .containsExactly(terminated.getId());
    }

    @Test
    void departmentFilterAcceptsSeveralDepartments() {
        assertThat(ids(ClientSpecifications.withFilters(null, null, List.of(otherDepartment.getId()), null)))
                .containsExactly(inOtherDepartment.getId());
        assertThat(ids(ClientSpecifications.withFilters(null, null, List.of(department.getId(), otherDepartment.getId()), null)))
                .containsExactlyInAnyOrder(active.getId(), terminated.getId(), ofOtherCaregiver.getId(), inOtherDepartment.getId());
    }

    @Test
    void caregiverFilterSelectsClientsOfTheKeyCaregiver() {
        assertThat(ids(ClientSpecifications.withFilters(null, null, null, List.of(caregiver.getId()))))
                .containsExactlyInAnyOrder(active.getId(), terminated.getId());
        assertThat(ids(ClientSpecifications.withFilters(null, null, null, List.of(caregiver.getId(), otherCaregiver.getId()))))
                .containsExactlyInAnyOrder(active.getId(), terminated.getId(), ofOtherCaregiver.getId());
    }

    @Test
    void filtersCombineWithAnd() {
        Specification<Client> filters = ClientSpecifications.withFilters(
                organization.getId(), true, List.of(department.getId()), List.of(caregiver.getId()));

        assertThat(ids(filters)).containsExactly(active.getId());
    }

    @Test
    void departmentOfAnotherOrganizationGivesNothing() {
        Long foreignDepartmentId = inOtherOrganization.getDepartment().getId();

        assertThat(ids(ClientSpecifications.withFilters(organization.getId(), null, List.of(foreignDepartmentId), null))).isEmpty();
    }

    private List<Long> ids(Specification<Client> specification) {
        flushAndClear();
        return clientRepository.findAll(specification).stream().map(Client::getId).toList();
    }
}
