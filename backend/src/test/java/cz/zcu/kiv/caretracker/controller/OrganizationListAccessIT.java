package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.repository.OrganizationRepository;
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
import static org.hamcrest.Matchers.empty;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** GET /api/organizations returns every organization to SUPERADMIN and only their own to everyone else. */
class OrganizationListAccessIT extends AbstractIntegrationTest {

    @Autowired
    private OrganizationRepository organizationRepository;

    private AccessScenario scenario;

    @BeforeEach
    void createScenario() {
        scenario = new AccessScenario(testData);
    }

    @Test
    void superadminSeesAllOrganizations() throws Exception {
        perform(SUPERADMIN, get("/api/organizations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(idOf(scenario.organization), idOf(scenario.otherOrganization))));
    }

    @ParameterizedTest
    @EnumSource(value = Actor.class, names = {"ADMIN", "COORDINATOR", "COORDINATOR_OTHER_DEPT", "CAREGIVER_OF_CLIENT", "CAREGIVER", "CAREGIVER_OTHER_DEPT"})
    void staffSeesOnlyOwnOrganization(Actor actor) throws Exception {
        perform(actor, get("/api/organizations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(idOf(scenario.organization))));
    }

    @ParameterizedTest
    @EnumSource(value = Actor.class, names = {"ADMIN_OTHER_ORG", "COORDINATOR_OTHER_ORG", "CAREGIVER_OTHER_ORG"})
    void staffOfOtherOrganizationSeesOnlyItsOrganization(Actor actor) throws Exception {
        perform(actor, get("/api/organizations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(idOf(scenario.otherOrganization))));
    }

    @Test
    void clientAccountCannotListOrganizations() throws Exception {
        perform(CLIENT_ACCOUNT, get("/api/organizations"))
                .andExpect(status().isForbidden());
    }

    @Test
    void inactiveFilterDoesNotRevealOtherOrganizations() throws Exception {
        Organization inactive = testData.organization();
        inactive.setActive(false);
        organizationRepository.save(inactive);

        perform(ADMIN, get("/api/organizations").param("status", "false"))
                .andExpect(jsonPath("$", empty()));
    }

    private ResultActions perform(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(scenario.user(actor))));
    }

    // JSON numbers are read back as Integer, so ids are compared as Integer
    private static int idOf(Organization organization) {
        return organization.getId().intValue();
    }
}
