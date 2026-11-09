package cz.zcu.kiv.caretracker.specification;

import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.support.AbstractRepositoryTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Filters of the employee list evaluated by PostgreSQL: organization, departments, status and role.
 * Who may use which filter is covered by {@code EmployeeListAccessIT}; here only what each filter selects.
 */
class EmployeeSpecificationsIT extends AbstractRepositoryTest {

    @Autowired
    private EmployeeRepository employeeRepository;

    private Organization organization;
    private Department department;
    private Department otherDepartment;
    private Employee coordinator;
    private Employee caregiver;
    private Employee terminated;
    private Employee inOtherDepartment;
    private Employee inOtherOrganization;

    @BeforeEach
    void createEmployees() {
        organization = testData.organization();
        department = testData.department(organization);
        otherDepartment = testData.department(organization);
        coordinator = testData.employee(department, EmployeeRole.COORDINATOR);
        caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        terminated = testData.employee(department, EmployeeRole.CAREGIVER);
        terminated.setActive(false);
        terminated = employeeRepository.save(terminated);
        inOtherDepartment = testData.employee(otherDepartment, EmployeeRole.CAREGIVER);
        inOtherOrganization = testData.employee(testData.department(testData.organization()), EmployeeRole.CAREGIVER);
    }

    @Test
    void withoutFiltersReturnsActiveAndInactiveEmployeesOfAllOrganizations() {
        assertThat(ids(EmployeeSpecifications.withFilters(null, null, null)))
                .containsExactlyInAnyOrder(coordinator.getId(), caregiver.getId(), terminated.getId(),
                        inOtherDepartment.getId(), inOtherOrganization.getId());
    }

    @Test
    void emptyDepartmentListMeansNoFilter() {
        assertThat(ids(EmployeeSpecifications.withFilters(organization.getId(), List.of(), null)))
                .containsExactlyInAnyOrder(coordinator.getId(), caregiver.getId(), terminated.getId(), inOtherDepartment.getId());
    }

    @Test
    void statusSelectsActiveOrTerminatedEmployees() {
        assertThat(ids(EmployeeSpecifications.withFilters(organization.getId(), null, true)))
                .containsExactlyInAnyOrder(coordinator.getId(), caregiver.getId(), inOtherDepartment.getId());
        assertThat(ids(EmployeeSpecifications.withFilters(organization.getId(), null, false)))
                .containsExactly(terminated.getId());
    }

    @Test
    void departmentFilterAcceptsSeveralDepartments() {
        assertThat(ids(EmployeeSpecifications.withFilters(null, List.of(otherDepartment.getId()), null)))
                .containsExactly(inOtherDepartment.getId());
        assertThat(ids(EmployeeSpecifications.withFilters(null, List.of(department.getId(), otherDepartment.getId()), null)))
                .containsExactlyInAnyOrder(coordinator.getId(), caregiver.getId(), terminated.getId(), inOtherDepartment.getId());
    }

    @Test
    void filtersCombineWithAnd() {
        assertThat(ids(EmployeeSpecifications.withFilters(organization.getId(), List.of(department.getId()), true)))
                .containsExactlyInAnyOrder(coordinator.getId(), caregiver.getId());
    }

    @Test
    void departmentOfAnotherOrganizationGivesNothing() {
        Long foreignDepartmentId = inOtherOrganization.getDepartment().getId();

        assertThat(ids(EmployeeSpecifications.withFilters(organization.getId(), List.of(foreignDepartmentId), null))).isEmpty();
    }

    @Test
    void roleFilterSelectsEmployeesWithThatRole() {
        Specification<Employee> coordinatorsOfOrganization =
                EmployeeSpecifications.hasOrganization(organization.getId()).and(EmployeeSpecifications.hasRole(EmployeeRole.COORDINATOR));

        assertThat(ids(coordinatorsOfOrganization)).containsExactly(coordinator.getId());
        assertThat(ids(EmployeeSpecifications.hasOrganization(organization.getId()).and(EmployeeSpecifications.hasRole(null))))
                .hasSize(4);
    }

    private List<Long> ids(Specification<Employee> specification) {
        flushAndClear();
        return employeeRepository.findAll(specification).stream().map(Employee::getId).toList();
    }
}
