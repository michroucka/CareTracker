package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.AccessScenario;
import cz.zcu.kiv.caretracker.support.AccessScenario.Actor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static cz.zcu.kiv.caretracker.support.AccessScenario.Actor.*;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * GET /api/departments returns the departments of the user's organization (all of them, also for coordinators
 * and caregivers, who need them in filters), whatever organization the request asks for.
 */
class DepartmentListAccessIT extends AbstractIntegrationTest {

    @Autowired
    private DepartmentRepository departmentRepository;

    private AccessScenario scenario;

    @BeforeEach
    void createScenario() {
        scenario = new AccessScenario(testData);
    }

    @ParameterizedTest
    @EnumSource(value = Actor.class, names = {"ADMIN", "COORDINATOR", "COORDINATOR_OTHER_DEPT", "CAREGIVER_OF_CLIENT", "CAREGIVER", "CAREGIVER_OTHER_DEPT"})
    void staffSeesDepartmentsOfOwnOrganization(Actor actor) throws Exception {
        perform(actor, get("/api/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(departmentIdsOf(scenario.organization))));
    }

    @ParameterizedTest
    @EnumSource(value = Actor.class, names = {"ADMIN_OTHER_ORG", "COORDINATOR_OTHER_ORG", "CAREGIVER_OTHER_ORG"})
    void staffOfOtherOrganizationSeesOnlyItsDepartments(Actor actor) throws Exception {
        perform(actor, get("/api/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(departmentIdsOf(scenario.otherOrganization))));
    }

    @Test
    void superadminListsDepartmentsOfSelectedOrganization() throws Exception {
        perform(SUPERADMIN, get("/api/departments").param("organizationId", scenario.otherOrganization.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(departmentIdsOf(scenario.otherOrganization))));
    }

    @Test
    void clientAccountCannotListDepartments() throws Exception {
        perform(CLIENT_ACCOUNT, get("/api/departments"))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @EnumSource(value = Actor.class, names = {"ADMIN", "COORDINATOR", "CAREGIVER"})
    void organizationParameterCannotWidenScope(Actor actor) throws Exception {
        perform(actor, get("/api/departments").param("organizationId", scenario.otherOrganization.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(departmentIdsOf(scenario.organization))));
    }

    @Test
    void inactiveFilterDoesNotRevealOtherOrganization() throws Exception {
        Department inactiveForeign = testData.department(scenario.otherOrganization);
        inactiveForeign.setActive(false);
        departmentRepository.save(inactiveForeign);
        Department inactiveOwn = testData.department(scenario.organization);
        inactiveOwn.setActive(false);
        departmentRepository.save(inactiveOwn);

        perform(ADMIN, get("/api/departments").param("status", "false"))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(inactiveOwn.getId().intValue())));
    }

    private ResultActions perform(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(scenario.user(actor))));
    }

    // JSON numbers are read back as Integer, so ids are compared as Integer
    private Object[] departmentIdsOf(Organization organization) {
        return departmentRepository.findByOrganizationId(organization.getId()).stream()
                .map(department -> department.getId().intValue())
                .toArray();
    }
}
