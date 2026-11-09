package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.PerformedTaskRepository;
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
import java.util.List;
import java.util.Map;
import java.util.Set;

import static cz.zcu.kiv.caretracker.support.AccessScenario.Actor.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Who may read and change a performed task of the scenario's client (performed by
 * {@link Actor#CAREGIVER_OF_CLIENT}) and download its receipts and payment QR code.
 * Every matrix test runs once per {@link Actor}; allowed actors get 2xx, everyone else 403.
 * The organization has no bank account, so the payment QR code is never fetched from the external API.
 */
class PerformedTaskAccessIT extends AbstractIntegrationTest {

    private static final Set<Actor> DEPARTMENT_STAFF = EnumSet.of(SUPERADMIN, ADMIN, COORDINATOR, CAREGIVER_OF_CLIENT, CAREGIVER);
    private static final Set<Actor> READERS = EnumSet.of(SUPERADMIN, ADMIN, COORDINATOR, CAREGIVER_OF_CLIENT, CAREGIVER, CLIENT_ACCOUNT);
    // a caregiver may change only records they performed (validateCaregiverAssignment)
    private static final Set<Actor> EDITORS = EnumSet.of(SUPERADMIN, ADMIN, COORDINATOR, CAREGIVER_OF_CLIENT);
    private static final Set<Actor> CLIENT_ITSELF = EnumSet.of(CLIENT_ACCOUNT);

    @Autowired
    private PerformedTaskRepository performedTaskRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    private AccessScenario scenario;
    private Task task;
    private PerformedTask performedTask;

    @BeforeEach
    void createScenario() {
        scenario = new AccessScenario(testData);
        task = testData.task(scenario.organization);
        performedTask = testData.performedTask(scenario.client, task, scenario.employee(CAREGIVER_OF_CLIENT));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void readDetail(Actor actor) throws Exception {
        perform(actor, get("/api/performed-tasks/{id}", performedTask.getId()))
                .andExpect(allowedOnlyFor(READERS, actor));
    }

    @Test
    void detailContainsRequestedRecord() throws Exception {
        perform(CLIENT_ACCOUNT, get("/api/performed-tasks/{id}", performedTask.getId()))
                .andExpect(jsonPath("$.id").value(performedTask.getId()));
    }

    @Test
    void clientAccountCannotReadRecordOfOtherClient() throws Exception {
        PerformedTask otherClientsRecord = testData.performedTask(otherClientInDepartment(), task, scenario.employee(CAREGIVER_OF_CLIENT));

        perform(CLIENT_ACCOUNT, get("/api/performed-tasks/{id}", otherClientsRecord.getId()))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void createRecord(Actor actor) throws Exception {
        perform(actor, post("/api/performed-tasks").contentType(MediaType.APPLICATION_JSON)
                .content(json(recordRequest(scenario.client, task, recordedCaregiverFor(actor).getId()))))
                .andExpect(allowedOnlyFor(DEPARTMENT_STAFF, actor));
    }

    @Test
    void coordinatorCannotCreateRecordForClientInOtherDepartment() throws Exception {
        Client otherDepartmentClient = testData.client(scenario.employee(CAREGIVER_OTHER_DEPT));

        perform(COORDINATOR, post("/api/performed-tasks").contentType(MediaType.APPLICATION_JSON)
                .content(json(recordRequest(otherDepartmentClient, task, scenario.employee(CAREGIVER_OTHER_DEPT).getId()))))
                .andExpect(status().isForbidden());

        assertThat(performedTaskRepository.count()).isEqualTo(1);
    }

    @Test
    void adminCannotCreateRecordWithTaskOfOtherOrganization() throws Exception {
        Task otherOrganizationTask = testData.task(scenario.otherOrganization);

        perform(ADMIN, post("/api/performed-tasks").contentType(MediaType.APPLICATION_JSON)
                .content(json(recordRequest(scenario.client, otherOrganizationTask, scenario.employee(CAREGIVER_OF_CLIENT).getId()))))
                .andExpect(status().isForbidden());

        assertThat(performedTaskRepository.count()).isEqualTo(1);
    }

    @Test
    void adminCannotAssignCaregiverOfOtherOrganization() throws Exception {
        perform(ADMIN, post("/api/performed-tasks").contentType(MediaType.APPLICATION_JSON)
                .content(json(recordRequest(scenario.client, task, scenario.employee(CAREGIVER_OTHER_ORG).getId()))))
                .andExpect(status().isForbidden());

        assertThat(performedTaskRepository.count()).isEqualTo(1);
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void updateRecord(Actor actor) throws Exception {
        perform(actor, put("/api/performed-tasks/{id}", performedTask.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(recordRequest(scenario.client, task, scenario.employee(CAREGIVER_OF_CLIENT).getId()))))
                .andExpect(allowedOnlyFor(EDITORS, actor));
    }

    @Test
    void rejectedUpdateLeavesRecordUnchanged() throws Exception {
        Map<String, Object> request = recordRequest(scenario.client, task, scenario.employee(CAREGIVER).getId());
        request.put("unitCount", 120.0);

        perform(CAREGIVER, put("/api/performed-tasks/{id}", performedTask.getId()).contentType(MediaType.APPLICATION_JSON).content(json(request)))
                .andExpect(status().isForbidden());

        assertThat(performedTaskRepository.findById(performedTask.getId())).get()
                .extracting(PerformedTask::getUnitCount)
                .isEqualTo(60.0);
    }

    @Test
    void coordinatorCannotMoveRecordToClientInOtherDepartment() throws Exception {
        Client otherDepartmentClient = testData.client(scenario.employee(CAREGIVER_OTHER_DEPT));

        perform(COORDINATOR, put("/api/performed-tasks/{id}", performedTask.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(recordRequest(otherDepartmentClient, task, scenario.employee(CAREGIVER_OF_CLIENT).getId()))))
                .andExpect(status().isForbidden());

        assertThat(performedTaskRepository.findById(performedTask.getId())).get()
                .extracting(saved -> saved.getDepartment().getId())
                .isEqualTo(scenario.department.getId());
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void deleteRecord(Actor actor) throws Exception {
        perform(actor, delete("/api/performed-tasks/{id}", performedTask.getId()))
                .andExpect(allowedOnlyFor(EDITORS, actor));
    }

    @Test
    void rejectedDeleteKeepsRecord() throws Exception {
        perform(CAREGIVER, delete("/api/performed-tasks/{id}", performedTask.getId()))
                .andExpect(status().isForbidden());

        assertThat(performedTaskRepository.existsById(performedTask.getId())).isTrue();
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void downloadClientReceipt(Actor actor) throws Exception {
        perform(actor, get("/api/performed-tasks/receipt")
                .param("clientId", scenario.client.getId().toString())
                .param("month", "11")
                .param("year", "2026"))
                .andExpect(allowedOnlyFor(DEPARTMENT_STAFF, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void downloadDepartmentReceipts(Actor actor) throws Exception {
        perform(actor, get("/api/performed-tasks/receipts")
                .param("departmentId", scenario.department.getId().toString())
                .param("month", "11")
                .param("year", "2026"))
                .andExpect(allowedOnlyFor(DEPARTMENT_STAFF, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void getPaymentQrCode(Actor actor) throws Exception {
        perform(actor, get("/api/performed-tasks/payment-qr")
                .param("clientId", scenario.client.getId().toString())
                .param("month", "11")
                .param("year", "2026"))
                .andExpect(allowedOnlyFor(CLIENT_ITSELF, actor));
    }

    @Test
    void clientAccountCannotGetPaymentQrCodeOfOtherClient() throws Exception {
        Client otherOrganizationClient = testData.client(scenario.employee(CAREGIVER_OTHER_ORG));

        perform(CLIENT_ACCOUNT, get("/api/performed-tasks/payment-qr")
                .param("clientId", otherOrganizationClient.getId().toString())
                .param("month", "11")
                .param("year", "2026"))
                .andExpect(status().isForbidden());
    }

    private Client otherClientInDepartment() {
        return testData.client(scenario.employee(CAREGIVER));
    }

    @Test
    void coordinatorCannotAddCaregiverFromOtherDepartment() throws Exception {
        perform(COORDINATOR, post("/api/performed-tasks").contentType(MediaType.APPLICATION_JSON)
                .content(json(recordRequest(scenario.client, task, scenario.employee(CAREGIVER_OTHER_DEPT).getId()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void caregiverMustBeAmongCaregiversOfOwnRecord() throws Exception {
        perform(CAREGIVER_OF_CLIENT, post("/api/performed-tasks").contentType(MediaType.APPLICATION_JSON)
                .content(json(recordRequest(scenario.client, task, scenario.employee(CAREGIVER).getId()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void coordinatorMayRecordWorkOfAnotherCaregiver() throws Exception {
        perform(COORDINATOR, post("/api/performed-tasks").contentType(MediaType.APPLICATION_JSON)
                .content(json(recordRequest(scenario.client, task, scenario.employee(CAREGIVER).getId()))))
                .andExpect(status().isOk());
    }

    @Test
    void recordStaysEditableAfterItsCaregiverMovedToOtherDepartment() throws Exception {
        Employee caregiver = scenario.employee(CAREGIVER_OF_CLIENT);
        caregiver.setDepartment(scenario.otherDepartment);
        employeeRepository.save(caregiver);

        perform(COORDINATOR, put("/api/performed-tasks/{id}", performedTask.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(recordRequest(scenario.client, task, caregiver.getId()))))
                .andExpect(status().isOk());
    }

    // a caregiver records own work, other staff record the work of the client's caregiver
    private Employee recordedCaregiverFor(Actor actor) {
        return switch (actor) {
            case CAREGIVER_OF_CLIENT, CAREGIVER, CAREGIVER_OTHER_DEPT, CAREGIVER_OTHER_ORG -> scenario.employee(actor);
            default -> scenario.employee(CAREGIVER_OF_CLIENT);
        };
    }

    private ResultActions perform(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(scenario.user(actor))));
    }

    private static ResultMatcher allowedOnlyFor(Set<Actor> allowed, Actor actor) {
        return allowed.contains(actor) ? status().is2xxSuccessful() : status().isForbidden();
    }

    private static Map<String, Object> recordRequest(Client client, Task task, Long caregiverId) {
        Map<String, Object> request = new HashMap<>();
        request.put("date", "2026-11-03T10:00:00");
        request.put("unitCount", 30.0);
        request.put("clientId", client.getId());
        request.put("taskId", task.getId());
        request.put("caregiverIds", List.of(caregiverId));
        return request;
    }
}
