package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.AccessScenario;
import cz.zcu.kiv.caretracker.support.AccessScenario.Actor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;

import static cz.zcu.kiv.caretracker.support.AccessScenario.Actor.*;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.empty;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** GET /api/clients returns only clients the user may see, whatever filters the request sends. */
class ClientListAccessIT extends AbstractIntegrationTest {

    enum Visible { CLIENT, OTHER_DEPARTMENT_CLIENT, OTHER_ORGANIZATION_CLIENT }

    @Autowired
    private ClientRepository clientRepository;

    private AccessScenario scenario;
    private Client otherDepartmentClient;
    private Client otherOrganizationClient;

    @BeforeEach
    void createClientsInThreeDepartments() {
        scenario = new AccessScenario(testData);
        otherDepartmentClient = testData.client(scenario.employee(CAREGIVER_OTHER_DEPT));
        otherOrganizationClient = testData.client(scenario.employee(CAREGIVER_OTHER_ORG));
    }

    static Stream<Arguments> visibleClientsByActor() {
        return Stream.of(
                Arguments.of(SUPERADMIN, List.of(Visible.CLIENT, Visible.OTHER_DEPARTMENT_CLIENT, Visible.OTHER_ORGANIZATION_CLIENT)),
                Arguments.of(ADMIN, List.of(Visible.CLIENT, Visible.OTHER_DEPARTMENT_CLIENT)),
                Arguments.of(ADMIN_OTHER_ORG, List.of(Visible.OTHER_ORGANIZATION_CLIENT)),
                Arguments.of(COORDINATOR, List.of(Visible.CLIENT)),
                Arguments.of(COORDINATOR_OTHER_DEPT, List.of(Visible.OTHER_DEPARTMENT_CLIENT)),
                Arguments.of(COORDINATOR_OTHER_ORG, List.of(Visible.OTHER_ORGANIZATION_CLIENT)),
                Arguments.of(CAREGIVER_OF_CLIENT, List.of(Visible.CLIENT)),
                Arguments.of(CAREGIVER, List.of(Visible.CLIENT)),
                Arguments.of(CAREGIVER_OTHER_DEPT, List.of(Visible.OTHER_DEPARTMENT_CLIENT)),
                Arguments.of(CAREGIVER_OTHER_ORG, List.of(Visible.OTHER_ORGANIZATION_CLIENT))
        );
    }

    @ParameterizedTest
    @MethodSource("visibleClientsByActor")
    void listShowsOnlyClientsInScope(Actor actor, List<Visible> expected) throws Exception {
        perform(actor, get("/api/clients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(ids(expected))));
    }

    @Test
    void clientAccountCannotListClients() throws Exception {
        perform(CLIENT_ACCOUNT, get("/api/clients"))
                .andExpect(status().isForbidden());
    }

    @Test
    void superadminCanNarrowListToOrganization() throws Exception {
        perform(SUPERADMIN, get("/api/clients").param("organizationId", scenario.organization.getId().toString()))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(ids(List.of(Visible.CLIENT, Visible.OTHER_DEPARTMENT_CLIENT)))));
    }

    @Test
    void adminCannotListOtherOrganizationByParameter() throws Exception {
        perform(ADMIN, get("/api/clients").param("organizationId", scenario.otherOrganization.getId().toString()))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(ids(List.of(Visible.CLIENT, Visible.OTHER_DEPARTMENT_CLIENT)))));
    }

    @Test
    void adminCannotListOtherOrganizationDepartmentByParameter() throws Exception {
        perform(ADMIN, get("/api/clients").param("departmentIds", scenario.otherOrganizationDepartment.getId().toString()))
                .andExpect(jsonPath("$", empty()));
    }

    @Test
    void coordinatorCannotListOtherDepartmentByParameter() throws Exception {
        perform(COORDINATOR, get("/api/clients").param("departmentIds", scenario.otherDepartment.getId().toString()))
                .andExpect(jsonPath("$", empty()));
    }

    @Test
    void caregiverCannotListTerminatedClients() throws Exception {
        Client client = scenario.client;
        client.setActive(false);
        clientRepository.save(client);

        perform(CAREGIVER, get("/api/clients").param("status", "false"))
                .andExpect(jsonPath("$", empty()));
    }

    private ResultActions perform(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(scenario.user(actor))));
    }

    // JSON numbers are read back as Integer, so ids are compared as Integer
    private Object[] ids(List<Visible> visible) {
        return visible.stream()
                .map(this::clientOf)
                .map(client -> client.getId().intValue())
                .toArray();
    }

    private Client clientOf(Visible visible) {
        return switch (visible) {
            case CLIENT -> scenario.client;
            case OTHER_DEPARTMENT_CLIENT -> otherDepartmentClient;
            case OTHER_ORGANIZATION_CLIENT -> otherOrganizationClient;
        };
    }
}
