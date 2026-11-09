package cz.zcu.kiv.caretracker.controller;

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
 * Who may read and change a task of the scenario's organization (billable service catalog).
 * The catalog belongs to the whole organization, so departments do not matter.
 * Every test runs once per {@link Actor}; allowed actors get 2xx, everyone else 403.
 */
class TaskAccessIT extends AbstractIntegrationTest {

    private static final Set<Actor> ORGANIZATION_STAFF = EnumSet.of(SUPERADMIN, ADMIN, COORDINATOR, COORDINATOR_OTHER_DEPT,
            CAREGIVER_OF_CLIENT, CAREGIVER, CAREGIVER_OTHER_DEPT);
    private static final Set<Actor> CATALOG_MANAGERS = EnumSet.of(SUPERADMIN, ADMIN);
    // creating always targets the admin's own organization, so an admin of another organization may create too
    private static final Set<Actor> CATALOG_CREATORS = EnumSet.of(SUPERADMIN, ADMIN, ADMIN_OTHER_ORG);

    @Autowired
    private TaskRepository taskRepository;

    private AccessScenario scenario;
    private Task task;

    @BeforeEach
    void createScenario() {
        scenario = new AccessScenario(testData);
        task = testData.task(scenario.organization);
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void readDetail(Actor actor) throws Exception {
        perform(actor, get("/api/tasks/{id}", task.getId()))
                .andExpect(allowedOnlyFor(ORGANIZATION_STAFF, actor));
    }

    @Test
    void detailContainsRequestedTask() throws Exception {
        perform(CAREGIVER, get("/api/tasks/{id}", task.getId()))
                .andExpect(jsonPath("$.id").value(task.getId()));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void createTask(Actor actor) throws Exception {
        perform(actor, post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
                .content(json(taskRequest(scenario.organization.getId()))))
                .andExpect(allowedOnlyFor(CATALOG_CREATORS, actor));
    }

    @Test
    void adminCreatesTaskInOwnOrganizationEvenIfRequestNamesAnother() throws Exception {
        Map<String, Object> request = taskRequest(scenario.organization.getId());
        request.put("name", "Cizí úkon");

        perform(ADMIN_OTHER_ORG, post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content(json(request)))
                .andExpect(status().isOk());

        assertThat(taskRepository.findByOrganizationId(scenario.organization.getId()))
                .noneMatch(saved -> "Cizí úkon".equals(saved.getName()));
        assertThat(taskRepository.findByOrganizationId(scenario.otherOrganization.getId()))
                .anyMatch(saved -> "Cizí úkon".equals(saved.getName()));
    }

    @Test
    void rejectedCreateLeavesCatalogUnchanged() throws Exception {
        perform(COORDINATOR, post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
                .content(json(taskRequest(scenario.organization.getId()))))
                .andExpect(status().isForbidden());

        assertThat(taskRepository.findAll()).extracting(Task::getId).containsExactly(task.getId());
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void updateTask(Actor actor) throws Exception {
        perform(actor, put("/api/tasks/{id}", task.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(taskRequest(scenario.organization.getId()))))
                .andExpect(allowedOnlyFor(CATALOG_MANAGERS, actor));
    }

    @ParameterizedTest
    @EnumSource(value = Actor.class, names = {"ADMIN_OTHER_ORG", "COORDINATOR"})
    void rejectedUpdateLeavesTaskUnchanged(Actor actor) throws Exception {
        perform(actor, put("/api/tasks/{id}", task.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(taskRequest(scenario.organization.getId()))))
                .andExpect(status().isForbidden());

        Task saved = taskRepository.findById(task.getId()).orElseThrow();
        assertThat(saved.getName()).isEqualTo(task.getName());
        assertThat(saved.getUnitPrice()).isEqualTo(task.getUnitPrice());
    }

    @Test
    void adminCannotMoveTaskToOtherOrganization() throws Exception {
        perform(ADMIN, put("/api/tasks/{id}", task.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(taskRequest(scenario.otherOrganization.getId()))));

        assertThat(taskRepository.findById(task.getId())).get()
                .extracting(saved -> saved.getOrganization().getId())
                .isEqualTo(scenario.organization.getId());
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void terminateTask(Actor actor) throws Exception {
        perform(actor, put("/api/tasks/{id}/terminate", task.getId()))
                .andExpect(allowedOnlyFor(CATALOG_MANAGERS, actor));
    }

    @Test
    void rejectedTerminationLeavesTaskActive() throws Exception {
        perform(ADMIN_OTHER_ORG, put("/api/tasks/{id}/terminate", task.getId()))
                .andExpect(status().isForbidden());

        assertThat(taskRepository.findById(task.getId())).get()
                .extracting(Task::getActive)
                .isEqualTo(true);
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void activateTask(Actor actor) throws Exception {
        task.setActive(false);
        taskRepository.save(task);

        perform(actor, put("/api/tasks/{id}/activate", task.getId()))
                .andExpect(allowedOnlyFor(CATALOG_MANAGERS, actor));
    }

    @Test
    void rejectedActivationLeavesTaskInactive() throws Exception {
        task.setActive(false);
        taskRepository.save(task);

        perform(ADMIN_OTHER_ORG, put("/api/tasks/{id}/activate", task.getId()))
                .andExpect(status().isForbidden());

        assertThat(taskRepository.findById(task.getId())).get()
                .extracting(Task::getActive)
                .isEqualTo(false);
    }

    private ResultActions perform(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(scenario.user(actor))));
    }

    private static ResultMatcher allowedOnlyFor(Set<Actor> allowed, Actor actor) {
        return allowed.contains(actor) ? status().is2xxSuccessful() : status().isForbidden();
    }

    private static Map<String, Object> taskRequest(Long organizationId) {
        Map<String, Object> request = new HashMap<>();
        request.put("name", "Dovoz oběda");
        request.put("unitPrice", 40);
        request.put("unitType", "OCCURRENCE");
        request.put("doubleMeeting", false);
        request.put("organizationId", organizationId);
        return request;
    }
}
