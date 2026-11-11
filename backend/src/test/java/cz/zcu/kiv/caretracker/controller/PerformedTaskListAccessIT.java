package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.AccessScenario;
import cz.zcu.kiv.caretracker.support.AccessScenario.Actor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static cz.zcu.kiv.caretracker.support.AccessScenario.Actor.*;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.empty;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** GET /api/performed-tasks returns only records the user may see, whatever filters the request sends. */
class PerformedTaskListAccessIT extends AbstractIntegrationTest {

    /** Whose record it is, relative to the scenario's client. */
    enum Owner { CLIENT, OTHER_CLIENT_IN_DEPARTMENT, OTHER_DEPARTMENT, OTHER_ORGANIZATION }

    private AccessScenario scenario;
    private final Map<Owner, PerformedTask> records = new EnumMap<>(Owner.class);

    @BeforeEach
    void createScenario() {
        scenario = new AccessScenario(testData);
        Task task = testData.task(scenario.organization);
        Task otherOrganizationTask = testData.task(scenario.otherOrganization);

        records.put(Owner.CLIENT, testData.performedTask(scenario.client, task, scenario.employee(CAREGIVER_OF_CLIENT)));
        records.put(Owner.OTHER_CLIENT_IN_DEPARTMENT, recordOfNewClient(scenario.employee(CAREGIVER), task));
        records.put(Owner.OTHER_DEPARTMENT, recordOfNewClient(scenario.employee(CAREGIVER_OTHER_DEPT), task));
        records.put(Owner.OTHER_ORGANIZATION, recordOfNewClient(scenario.employee(CAREGIVER_OTHER_ORG), otherOrganizationTask));
    }

    static Stream<Arguments> visibleRecordsByActor() {
        List<Owner> department = List.of(Owner.CLIENT, Owner.OTHER_CLIENT_IN_DEPARTMENT);
        return Stream.of(
                Arguments.of(SUPERADMIN, List.of(Owner.values())),
                Arguments.of(ADMIN, List.of(Owner.CLIENT, Owner.OTHER_CLIENT_IN_DEPARTMENT, Owner.OTHER_DEPARTMENT)),
                Arguments.of(ADMIN_OTHER_ORG, List.of(Owner.OTHER_ORGANIZATION)),
                Arguments.of(COORDINATOR, department),
                Arguments.of(COORDINATOR_OTHER_DEPT, List.of(Owner.OTHER_DEPARTMENT)),
                Arguments.of(COORDINATOR_OTHER_ORG, List.of(Owner.OTHER_ORGANIZATION)),
                Arguments.of(CAREGIVER_OF_CLIENT, department),
                Arguments.of(CAREGIVER, department),
                Arguments.of(CAREGIVER_OTHER_DEPT, List.of(Owner.OTHER_DEPARTMENT)),
                Arguments.of(CAREGIVER_OTHER_ORG, List.of(Owner.OTHER_ORGANIZATION)),
                Arguments.of(CLIENT_ACCOUNT, List.of(Owner.CLIENT))
        );
    }

    @ParameterizedTest
    @MethodSource("visibleRecordsByActor")
    void listShowsOnlyRecordsInScope(Actor actor, List<Owner> expected) throws Exception {
        perform(actor, get("/api/performed-tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(recordIds(expected))));
    }

    @Test
    void superadminCanNarrowListToOrganization() throws Exception {
        perform(SUPERADMIN, get("/api/performed-tasks").param("organizationId", scenario.organization.getId().toString()))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(recordIds(List.of(Owner.CLIENT, Owner.OTHER_CLIENT_IN_DEPARTMENT, Owner.OTHER_DEPARTMENT)))));
    }

    @Test
    void adminCannotListOtherOrganizationByParameter() throws Exception {
        perform(ADMIN, get("/api/performed-tasks").param("organizationId", scenario.otherOrganization.getId().toString()))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(recordIds(List.of(Owner.CLIENT, Owner.OTHER_CLIENT_IN_DEPARTMENT, Owner.OTHER_DEPARTMENT)))));
    }

    @Test
    void adminCannotListOtherOrganizationDepartmentByParameter() throws Exception {
        perform(ADMIN, get("/api/performed-tasks").param("departmentIds", scenario.otherOrganizationDepartment.getId().toString()))
                .andExpect(jsonPath("$", empty()));
    }

    @Test
    void adminCannotListOtherOrganizationCaregiverByParameter() throws Exception {
        perform(ADMIN, get("/api/performed-tasks").param("caregiverIds", scenario.employee(CAREGIVER_OTHER_ORG).getId().toString()))
                .andExpect(jsonPath("$", empty()));
    }

    @Test
    void adminCannotListOtherOrganizationClientByParameter() throws Exception {
        perform(ADMIN, get("/api/performed-tasks").param("clientId", clientOf(Owner.OTHER_ORGANIZATION).toString()))
                .andExpect(jsonPath("$", empty()));
    }

    @Test
    void coordinatorCannotListOtherDepartmentByParameter() throws Exception {
        perform(COORDINATOR, get("/api/performed-tasks").param("departmentIds", scenario.otherDepartment.getId().toString()))
                .andExpect(jsonPath("$", empty()));
    }

    @Test
    void coordinatorCannotListOtherDepartmentCaregiverByParameter() throws Exception {
        perform(COORDINATOR, get("/api/performed-tasks").param("caregiverIds", scenario.employee(CAREGIVER_OTHER_DEPT).getId().toString()))
                .andExpect(jsonPath("$", empty()));
    }

    @Test
    void caregiverCannotListOtherDepartmentClientByParameter() throws Exception {
        perform(CAREGIVER, get("/api/performed-tasks").param("clientId", clientOf(Owner.OTHER_DEPARTMENT).toString()))
                .andExpect(jsonPath("$", empty()));
    }

    @Test
    void clientAccountCannotListOtherClientByParameter() throws Exception {
        perform(CLIENT_ACCOUNT, get("/api/performed-tasks").param("clientId", clientOf(Owner.OTHER_CLIENT_IN_DEPARTMENT).toString()))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(recordIds(List.of(Owner.CLIENT)))));
    }

    @Test
    void clientAccountWithoutLinkedClientSeesNoRecords() throws Exception {
        User account = testData.unlinkedClientAccount();

        mockMvc.perform(get("/api/performed-tasks").with(loggedInAs(account)))
                .andExpect(jsonPath("$", empty()));
    }

    @Test
    void clientAccountIgnoresScopeParameters() throws Exception {
        perform(CLIENT_ACCOUNT, get("/api/performed-tasks")
                .param("organizationId", scenario.otherOrganization.getId().toString())
                .param("departmentIds", scenario.otherDepartment.getId().toString())
                .param("caregiverIds", scenario.employee(CAREGIVER_OTHER_DEPT).getId().toString()))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(recordIds(List.of(Owner.CLIENT)))));
    }

    private PerformedTask recordOfNewClient(Employee caregiver, Task task) {
        Client client = testData.client(caregiver);
        return testData.performedTask(client, task, caregiver);
    }

    private Long clientOf(Owner owner) {
        return records.get(owner).getClient().getId();
    }

    private ResultActions perform(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(scenario.user(actor))));
    }

    // JSON numbers are read back as Integer, so ids are compared as Integer
    private Object[] recordIds(List<Owner> owners) {
        return owners.stream().map(owner -> records.get(owner).getId().intValue()).toArray();
    }
}
