package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.IndividualPlan;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.support.AbstractRepositoryTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Plans due for an update (dashboard attention list) per caregiver, department and organization.
 * {@code DashboardTotalsIT} covers the 30-day horizon and the order for one caregiver; here the scope of each query
 * and that plans of terminated clients are left out.
 */
class IndividualPlanRepositoryIT extends AbstractRepositoryTest {

    private static final LocalDate HORIZON = LocalDate.of(2026, 12, 31);

    @Autowired
    private IndividualPlanRepository individualPlanRepository;

    @Autowired
    private ClientRepository clientRepository;

    private Organization organization;
    private Department department;
    private Employee caregiver;
    private Employee colleague;
    private IndividualPlan ofCaregiver;
    private IndividualPlan ofColleague;
    private IndividualPlan inOtherDepartment;

    @BeforeEach
    void createPlans() {
        organization = testData.organization();
        department = testData.department(organization);
        caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        colleague = testData.employee(department, EmployeeRole.CAREGIVER);
        Employee otherDepartmentCaregiver = testData.employee(testData.department(organization), EmployeeRole.CAREGIVER);
        Employee otherOrganizationCaregiver = testData.employee(testData.department(testData.organization()), EmployeeRole.CAREGIVER);

        ofCaregiver = testData.individualPlan(testData.client(caregiver), HORIZON);
        ofColleague = testData.individualPlan(testData.client(colleague), LocalDate.of(2026, 11, 1));
        inOtherDepartment = testData.individualPlan(testData.client(otherDepartmentCaregiver), LocalDate.of(2026, 12, 1));
        testData.individualPlan(testData.client(caregiver), HORIZON.plusDays(1));
        testData.individualPlan(terminatedClientOf(caregiver), LocalDate.of(2026, 10, 1));
        testData.individualPlan(testData.client(otherOrganizationCaregiver), LocalDate.of(2026, 10, 1));
        flushAndClear();
    }

    @Test
    void caregiverSeesPlansOfOwnActiveClientsOnly() {
        assertThat(ids(individualPlanRepository.findUpcomingUpdatesByCaregiver(caregiver.getId(), HORIZON)))
                .containsExactly(ofCaregiver.getId());
    }

    @Test
    void departmentSeesPlansOfAllCaregiversSoonestFirst() {
        assertThat(ids(individualPlanRepository.findUpcomingUpdatesByDepartment(department.getId(), HORIZON)))
                .containsExactly(ofColleague.getId(), ofCaregiver.getId());
    }

    @Test
    void organizationSeesPlansOfAllDepartmentsSoonestFirst() {
        assertThat(ids(individualPlanRepository.findUpcomingUpdatesByOrganization(organization.getId(), HORIZON)))
                .containsExactly(ofColleague.getId(), inOtherDepartment.getId(), ofCaregiver.getId());
    }

    private Client terminatedClientOf(Employee keyCaregiver) {
        Client client = testData.client(keyCaregiver);
        client.setActive(false);
        return clientRepository.save(client);
    }

    private static List<Long> ids(List<IndividualPlan> plans) {
        return plans.stream().map(IndividualPlan::getId).toList();
    }
}
