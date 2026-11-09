package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.repository.TaskRepository;
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
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * GET /api/tasks returns only the catalog of the user's organization, whatever filters the request sends.
 * Only admins see inactive tasks; the rest of the staff works with the active catalog.
 */
class TaskListAccessIT extends AbstractIntegrationTest {

    @Autowired
    private TaskRepository taskRepository;

    private AccessScenario scenario;
    private Task task;
    private Task inactiveTask;
    private Task otherOrganizationTask;
    private Task otherOrganizationInactiveTask;

    @BeforeEach
    void createScenario() {
        scenario = new AccessScenario(testData);
        task = testData.task(scenario.organization);
        inactiveTask = inactiveTask(scenario.organization);
        otherOrganizationTask = testData.task(scenario.otherOrganization);
        otherOrganizationInactiveTask = inactiveTask(scenario.otherOrganization);
    }

    @ParameterizedTest
    @EnumSource(value = Actor.class, names = {"ADMIN", "COORDINATOR", "COORDINATOR_OTHER_DEPT",
            "CAREGIVER_OF_CLIENT", "CAREGIVER", "CAREGIVER_OTHER_DEPT"})
    void staffSeesActiveCatalogOfOwnOrganization(Actor actor) throws Exception {
        perform(actor, get("/api/tasks").param("status", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(idOf(task))));
    }

    @ParameterizedTest
    @EnumSource(value = Actor.class, names = {"ADMIN_OTHER_ORG", "COORDINATOR_OTHER_ORG", "CAREGIVER_OTHER_ORG"})
    void staffOfOtherOrganizationSeesOnlyItsCatalog(Actor actor) throws Exception {
        perform(actor, get("/api/tasks").param("status", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(idOf(otherOrganizationTask))));
    }

    @Test
    void clientAccountCannotListTasks() throws Exception {
        perform(CLIENT_ACCOUNT, get("/api/tasks"))
                .andExpect(status().isForbidden());
    }

    @Test
    void superadminListsCatalogOfRequestedOrganization() throws Exception {
        perform(SUPERADMIN, get("/api/tasks").param("organizationId", scenario.otherOrganization.getId().toString()))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(idOf(otherOrganizationTask), idOf(otherOrganizationInactiveTask))));
    }

    @Test
    void adminSeesWholeCatalogOfOwnOrganization() throws Exception {
        perform(ADMIN, get("/api/tasks"))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(idOf(task), idOf(inactiveTask))));
    }

    @Test
    void adminSeesInactiveTasksOfOwnOrganization() throws Exception {
        perform(ADMIN, get("/api/tasks").param("status", "false"))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(idOf(inactiveTask))));
    }

    @Test
    void adminCannotListOtherOrganizationByParameter() throws Exception {
        perform(ADMIN, get("/api/tasks").param("organizationId", scenario.otherOrganization.getId().toString()))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(idOf(task), idOf(inactiveTask))));
    }

    @ParameterizedTest
    @EnumSource(value = Actor.class, names = {"COORDINATOR", "CAREGIVER"})
    void staffCannotListOtherOrganizationByParameter(Actor actor) throws Exception {
        perform(actor, get("/api/tasks").param("organizationId", scenario.otherOrganization.getId().toString()).param("status", "true"))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(idOf(task))));
    }

    @ParameterizedTest
    @EnumSource(value = Actor.class, names = {"COORDINATOR", "CAREGIVER"})
    void staffCannotListInactiveTasks(Actor actor) throws Exception {
        perform(actor, get("/api/tasks").param("status", "false"))
                .andExpect(jsonPath("$[*].id", not(hasItem(idOf(inactiveTask)))));
    }

    @ParameterizedTest
    @EnumSource(value = Actor.class, names = {"COORDINATOR", "CAREGIVER"})
    void staffListWithoutStatusContainsOnlyActiveTasks(Actor actor) throws Exception {
        perform(actor, get("/api/tasks"))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(idOf(task))));
    }

    private Task inactiveTask(Organization organization) {
        Task inactive = testData.task(organization);
        inactive.setActive(false);
        return taskRepository.save(inactive);
    }

    private ResultActions perform(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(scenario.user(actor))));
    }

    // JSON numbers are read back as Integer, so ids are compared as Integer
    private static Integer idOf(Task task) {
        return task.getId().intValue();
    }
}
