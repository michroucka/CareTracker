package cz.zcu.kiv.caretracker.service;

import com.jayway.jsonpath.JsonPath;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.UnitType;
import cz.zcu.kiv.caretracker.repository.TaskRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Catalog of tasks (úkony): creating, editing, deactivating and activating a task, and what deactivation
 * means for work already recorded with it.
 */
class TaskCatalogIT extends AbstractIntegrationTest {

    @Autowired
    private TaskRepository taskRepository;

    private Organization organization;
    private Employee admin;

    @BeforeEach
    void createOrganization() {
        organization = testData.organization();
        admin = testData.employee(testData.department(organization), EmployeeRole.MANAGER);
    }

    @Test
    void newTaskIsActiveInAdminsOrganization() throws Exception {
        long id = createdId(perform(admin.getUser(), post("/api/tasks"), taskRequest(null)).andExpect(status().isOk()));

        Task saved = taskRepository.findById(id).orElseThrow();
        assertThat(saved.getName()).isEqualTo("Doprovod k lékaři");
        assertThat(saved.getUnitPrice()).isEqualTo(150);
        assertThat(saved.getUnitType()).isEqualTo(UnitType.HOUR);
        assertThat(saved.getDoubleMeeting()).isTrue();
        assertThat(saved.getActive()).isTrue();
        assertThat(saved.getOrganization().getId()).isEqualTo(organization.getId());
    }

    @Test
    void superadminCreatesTaskInChosenOrganization() throws Exception {
        long id = createdId(perform(testData.superadmin(), post("/api/tasks"), taskRequest(organization.getId()))
                .andExpect(status().isOk()));

        assertThat(taskRepository.findById(id).orElseThrow().getOrganization().getId()).isEqualTo(organization.getId());
    }

    @Test
    void superadminMustChooseOrganization() throws Exception {
        perform(testData.superadmin(), post("/api/tasks"), taskRequest(null)).andExpect(status().isBadRequest());

        assertThat(taskRepository.count()).isZero();
    }

    @Test
    void updateChangesTaskButKeepsItsOrganization() throws Exception {
        Task task = testData.task(organization, UnitType.OCCURRENCE, 40);
        Map<String, Object> request = taskRequest(null);
        request.put("unitType", "KM");
        request.put("unitPrice", 7);

        perform(testData.superadmin(), put("/api/tasks/{id}", task.getId()), request).andExpect(status().isOk());

        Task saved = taskRepository.findById(task.getId()).orElseThrow();
        assertThat(saved.getName()).isEqualTo("Doprovod k lékaři");
        assertThat(saved.getUnitType()).isEqualTo(UnitType.KM);
        assertThat(saved.getUnitPrice()).isEqualTo(7);
        assertThat(saved.getOrganization().getId()).isEqualTo(organization.getId());
    }

    @Test
    void updateOfDeactivatedTaskKeepsItDeactivated() throws Exception {
        Task task = testData.task(organization);
        perform(admin.getUser(), put("/api/tasks/{id}/terminate", task.getId())).andExpect(status().isOk());

        perform(admin.getUser(), put("/api/tasks/{id}", task.getId()), taskRequest(null)).andExpect(status().isOk());

        assertThat(taskRepository.findById(task.getId()).orElseThrow().getActive()).isFalse();
    }

    @Test
    void deactivationAndActivationToggleOnlyTheActiveFlag() throws Exception {
        Task task = testData.task(organization, UnitType.KM, 7);

        perform(admin.getUser(), put("/api/tasks/{id}/terminate", task.getId())).andExpect(status().isOk());
        assertThat(taskRepository.findById(task.getId()).orElseThrow().getActive()).isFalse();

        perform(admin.getUser(), put("/api/tasks/{id}/activate", task.getId())).andExpect(status().isOk());
        Task saved = taskRepository.findById(task.getId()).orElseThrow();
        assertThat(saved.getActive()).isTrue();
        assertThat(saved.getName()).isEqualTo(task.getName());
        assertThat(saved.getUnitPrice()).isEqualTo(7);
    }

    @Test
    void workRecordedWithDeactivatedTaskStaysListedWithItsPrice() throws Exception {
        Employee caregiver = testData.employee(admin.getDepartment(), EmployeeRole.CAREGIVER);
        Client client = testData.client(caregiver);
        Task task = testData.task(organization, UnitType.HOUR, 150);
        PerformedTask record = testData.performedTask(client, task, LocalDateTime.of(2026, 11, 2, 9, 0), 90);

        perform(admin.getUser(), put("/api/tasks/{id}/terminate", task.getId())).andExpect(status().isOk());

        perform(admin.getUser(), get("/api/performed-tasks").param("month", "11").param("year", "2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(record.getId()))
                .andExpect(jsonPath("$[0].taskName").value(task.getName()))
                .andExpect(jsonPath("$[0].price").value(225));
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -150})
    void priceMustBePositive(int unitPrice) throws Exception {
        Map<String, Object> request = taskRequest(null);
        request.put("unitPrice", unitPrice);

        perform(admin.getUser(), post("/api/tasks"), request).andExpect(status().isBadRequest());

        assertThat(taskRepository.count()).isZero();
    }

    private long createdId(ResultActions result) throws Exception {
        Number id = JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    private ResultActions perform(User account, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(account)));
    }

    private ResultActions perform(User account, MockHttpServletRequestBuilder request, Map<String, Object> body) throws Exception {
        return perform(account, request.contentType(MediaType.APPLICATION_JSON).content(json(body)));
    }

    private static Map<String, Object> taskRequest(Long organizationId) {
        Map<String, Object> request = new HashMap<>();
        request.put("name", "Doprovod k lékaři");
        request.put("unitPrice", 150);
        request.put("unitType", "HOUR");
        request.put("doubleMeeting", true);
        request.put("organizationId", organizationId);
        return request;
    }
}
