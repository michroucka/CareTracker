package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.repository.OrganizationRepository;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.AccessScenario;
import cz.zcu.kiv.caretracker.support.AccessScenario.Actor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.ResultMatcher;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static cz.zcu.kiv.caretracker.support.AccessScenario.Actor.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Who may read and change the scenario's organization. Reading is open to its staff, every change only to SUPERADMIN.
 * Every matrix test runs once per {@link Actor}; allowed actors get 2xx, everyone else 403.
 */
class OrganizationAccessIT extends AbstractIntegrationTest {

    private static final Set<Actor> ORGANIZATION_STAFF = EnumSet.of(SUPERADMIN, ADMIN, COORDINATOR, COORDINATOR_OTHER_DEPT,
            CAREGIVER_OF_CLIENT, CAREGIVER, CAREGIVER_OTHER_DEPT);
    private static final Set<Actor> ONLY_SUPERADMIN = EnumSet.of(SUPERADMIN);

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    private AccessScenario scenario;
    private Organization organization;

    @BeforeEach
    void createScenario() {
        scenario = new AccessScenario(testData);
        organization = scenario.organization;
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void readDetail(Actor actor) throws Exception {
        perform(actor, get("/api/organizations/{id}", organization.getId()))
                .andExpect(allowedOnlyFor(ORGANIZATION_STAFF, actor));
    }

    @Test
    void detailContainsRequestedOrganization() throws Exception {
        perform(CAREGIVER, get("/api/organizations/{id}", organization.getId()))
                .andExpect(jsonPath("$.id").value(organization.getId()));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void createOrganization(Actor actor) throws Exception {
        perform(actor, post("/api/organizations").contentType(MediaType.APPLICATION_JSON)
                .content(json(organizationRequest(null))))
                .andExpect(allowedOnlyFor(ONLY_SUPERADMIN, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void updateOrganization(Actor actor) throws Exception {
        perform(actor, put("/api/organizations/{id}", organization.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(organizationRequest(null))))
                .andExpect(allowedOnlyFor(ONLY_SUPERADMIN, actor));
    }

    @Test
    void adminCannotMakeColleagueManager() throws Exception {
        Employee caregiver = scenario.employee(CAREGIVER);

        perform(ADMIN, put("/api/organizations/{id}", organization.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(organizationRequest(caregiver.getId()))))
                .andExpect(status().isForbidden());

        assertThat(organizationRepository.findById(organization.getId())).get()
                .satisfies(saved -> {
                    assertThat(saved.getName()).isEqualTo(organization.getName());
                    assertThat(saved.getManager()).isNull();
                });
        assertThat(userRepository.findById(caregiver.getUser().getId())).get()
                .extracting(account -> account.getRole())
                .isEqualTo(UserRole.CAREGIVER);
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void terminateOrganization(Actor actor) throws Exception {
        perform(actor, put("/api/organizations/{id}/terminate", organization.getId()))
                .andExpect(allowedOnlyFor(ONLY_SUPERADMIN, actor));
    }

    @Test
    void rejectedTerminationLeavesOrganizationAndAccountsActive() throws Exception {
        perform(ADMIN, put("/api/organizations/{id}/terminate", organization.getId()))
                .andExpect(status().isForbidden());

        assertThat(organizationRepository.findById(organization.getId())).get()
                .extracting(Organization::getActive)
                .isEqualTo(true);
        assertThat(userRepository.findByEmployee_OrganizationId(organization.getId()))
                .isNotEmpty()
                .allSatisfy(account -> assertThat(account.getActive()).isTrue());
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void activateOrganization(Actor actor) throws Exception {
        organization.setActive(false);
        organizationRepository.save(organization);

        perform(actor, put("/api/organizations/{id}/activate", organization.getId()))
                .andExpect(allowedOnlyFor(ONLY_SUPERADMIN, actor));
    }

    @Test
    void superadminCannotMakeEmployeeOfOtherOrganizationManager() throws Exception {
        Employee outsider = scenario.employee(CAREGIVER_OTHER_ORG);

        perform(SUPERADMIN, put("/api/organizations/{id}", organization.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(organizationRequest(outsider.getId()))))
                .andExpect(status().isBadRequest());

        assertThat(userRepository.findById(outsider.getUser().getId())).get()
                .extracting(User::getRole)
                .isEqualTo(UserRole.CAREGIVER);
    }

    private ResultActions perform(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(scenario.user(actor))));
    }

    private static ResultMatcher allowedOnlyFor(Set<Actor> allowed, Actor actor) {
        return allowed.contains(actor) ? status().is2xxSuccessful() : status().isForbidden();
    }

    private static Map<String, Object> organizationRequest(Long managerId) {
        Map<String, Object> request = new HashMap<>();
        request.put("name", "Přejmenovaná organizace");
        request.put("managerId", managerId);
        return request;
    }
}
