package cz.zcu.kiv.caretracker.service;

import com.jayway.jsonpath.JsonPath;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.UnitType;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.PerformedTaskRepository;
import cz.zcu.kiv.caretracker.repository.TaskRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Business rules of performed tasks (úkony): what a create or update stores, who may stand among
 * the caregivers of a record, deleting, and the month filter of the list. Who may call which endpoint
 * at all is covered by {@code PerformedTaskAccessIT}.
 */
class PerformedTaskRulesIT extends AbstractIntegrationTest {

    @Autowired
    private PerformedTaskRepository performedTaskRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Organization organization;
    private Department department;
    private Department otherDepartment;
    private Employee coordinator;
    private Employee caregiver;
    private Employee colleague;
    private Employee otherDepartmentCaregiver;
    private Client client;
    private Task task;

    @BeforeEach
    void createDepartment() {
        organization = testData.organization();
        department = testData.department(organization);
        otherDepartment = testData.department(organization);
        coordinator = testData.employee(department, EmployeeRole.COORDINATOR);
        caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        colleague = testData.employee(department, EmployeeRole.CAREGIVER);
        otherDepartmentCaregiver = testData.employee(otherDepartment, EmployeeRole.CAREGIVER);
        client = testData.client(caregiver);
        task = testData.task(organization);
    }

    @Test
    void createStoresRecordInClientsDepartmentAndOrganization() throws Exception {
        Map<String, Object> request = request(client, task, caregiver);
        request.put("notes", "Nákup a úklid");

        long id = createdId(perform(coordinator, post("/api/performed-tasks"), request).andExpect(status().isOk()));

        PerformedTask saved = performedTaskRepository.findById(id).orElseThrow();
        assertThat(saved.getDate()).isEqualTo(LocalDateTime.of(2026, 11, 3, 10, 0));
        assertThat(saved.getUnitCount()).isEqualTo(30.0);
        assertThat(saved.getNotes()).isEqualTo("Nákup a úklid");
        assertThat(saved.getDepartment().getId()).isEqualTo(department.getId());
        assertThat(saved.getOrganization().getId()).isEqualTo(organization.getId());
        assertThat(caregiverIdsOf(id)).containsExactly(caregiver.getId());
    }

    @Test
    void caregiverRecordsWorkTogetherWithColleague() throws Exception {
        long id = createdId(perform(caregiver, post("/api/performed-tasks"), request(client, task, caregiver, colleague))
                .andExpect(status().isOk()));

        assertThat(caregiverIdsOf(id)).containsExactlyInAnyOrder(caregiver.getId(), colleague.getId());
    }

    @Test
    void caregiverCannotRemoveThemselvesFromOwnRecord() throws Exception {
        PerformedTask record = testData.performedTask(client, task, caregiver);

        perform(caregiver, put("/api/performed-tasks/{id}", record.getId()), request(client, task, colleague))
                .andExpect(status().isBadRequest());

        assertThat(caregiverIdsOf(record.getId())).containsExactly(caregiver.getId());
    }

    @Test
    void coordinatorReplacesCaregiverOfRecord() throws Exception {
        PerformedTask record = testData.performedTask(client, task, caregiver);

        perform(coordinator, put("/api/performed-tasks/{id}", record.getId()), request(client, task, colleague))
                .andExpect(status().isOk());

        assertThat(caregiverIdsOf(record.getId())).containsExactly(colleague.getId());
    }

    @Test
    void caregiverFromOtherDepartmentCannotBeAddedToExistingRecord() throws Exception {
        PerformedTask record = testData.performedTask(client, task, caregiver);

        perform(coordinator, put("/api/performed-tasks/{id}", record.getId()), request(client, task, caregiver, otherDepartmentCaregiver))
                .andExpect(status().isBadRequest());

        assertThat(caregiverIdsOf(record.getId())).containsExactly(caregiver.getId());
    }

    @Test
    void caregiverWhoMovedStaysOnRecordWhenColleagueIsAdded() throws Exception {
        PerformedTask record = testData.performedTask(client, task, caregiver);
        caregiver.setDepartment(otherDepartment);
        employeeRepository.save(caregiver);
        Map<String, Object> request = request(client, task, caregiver, colleague);
        request.put("unitCount", 90.0);

        perform(coordinator, put("/api/performed-tasks/{id}", record.getId()), request).andExpect(status().isOk());

        assertThat(caregiverIdsOf(record.getId())).containsExactlyInAnyOrder(caregiver.getId(), colleague.getId());
        assertThat(performedTaskRepository.findById(record.getId())).get()
                .extracting(PerformedTask::getUnitCount)
                .isEqualTo(90.0);
    }

    @Test
    void caregiverWhoMovedCannotBeAddedToNewRecordOfFormerClient() throws Exception {
        caregiver.setDepartment(otherDepartment);
        employeeRepository.save(caregiver);

        perform(coordinator, post("/api/performed-tasks"), request(client, task, caregiver))
                .andExpect(status().isBadRequest());

        assertThat(performedTaskRepository.count()).isZero();
    }

    @Test
    void recordMovedToClientOfOtherDepartmentFollowsTheClient() throws Exception {
        PerformedTask record = testData.performedTask(client, task, caregiver);
        Client otherDepartmentClient = testData.client(otherDepartmentCaregiver);
        Employee admin = testData.employee(department, EmployeeRole.MANAGER);

        perform(admin, put("/api/performed-tasks/{id}", record.getId()), request(otherDepartmentClient, task, caregiver))
                .andExpect(status().isOk());

        PerformedTask saved = performedTaskRepository.findById(record.getId()).orElseThrow();
        assertThat(saved.getClient().getId()).isEqualTo(otherDepartmentClient.getId());
        assertThat(saved.getDepartment().getId()).isEqualTo(otherDepartment.getId());
    }

    @Test
    void deleteRemovesRecordAndItsCaregiverLinksButNotTheCaregivers() throws Exception {
        PerformedTask record = testData.performedTask(client, task, LocalDateTime.of(2026, 11, 2, 9, 0), 60, colleague);

        perform(caregiver, delete("/api/performed-tasks/{id}", record.getId())).andExpect(status().isOk());

        assertThat(performedTaskRepository.existsById(record.getId())).isFalse();
        assertThat(caregiverIdsOf(record.getId())).isEmpty();
        assertThat(employeeRepository.existsById(caregiver.getId())).isTrue();
        assertThat(employeeRepository.existsById(colleague.getId())).isTrue();
        assertThat(clientRepository.existsById(client.getId())).isTrue();
    }

    @Test
    void missingRecordCannotBeUpdatedOrDeleted() throws Exception {
        perform(coordinator, put("/api/performed-tasks/{id}", 999_999), request(client, task, caregiver))
                .andExpect(status().isNotFound());
        perform(coordinator, delete("/api/performed-tasks/{id}", 999_999))
                .andExpect(status().isNotFound());
    }

    @Test
    void recordWithUnknownClientTaskOrCaregiverIsRejected() throws Exception {
        Map<String, Object> unknownClient = request(client, task, caregiver);
        unknownClient.put("clientId", 999_999);
        Map<String, Object> unknownTask = request(client, task, caregiver);
        unknownTask.put("taskId", 999_999);
        Map<String, Object> unknownCaregiver = request(client, task, caregiver);
        unknownCaregiver.put("caregiverIds", List.of(caregiver.getId(), 999_999));

        perform(coordinator, post("/api/performed-tasks"), unknownClient).andExpect(status().isNotFound());
        perform(coordinator, post("/api/performed-tasks"), unknownTask).andExpect(status().isNotFound());
        perform(coordinator, post("/api/performed-tasks"), unknownCaregiver).andExpect(status().isNotFound());

        assertThat(performedTaskRepository.count()).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {"date", "unitCount", "caregiverIds"})
    void recordWithoutRequiredValueIsRejected(String missingField) throws Exception {
        Map<String, Object> request = request(client, task, caregiver);
        request.remove(missingField);

        perform(coordinator, post("/api/performed-tasks"), request).andExpect(status().isBadRequest());

        assertThat(performedTaskRepository.count()).isZero();
    }

    @Test
    void monthFilterReturnsOnlyRecordsOfThatMonth() throws Exception {
        PerformedTask firstMoment = testData.performedTask(client, task, LocalDateTime.of(2026, 11, 1, 0, 0));
        PerformedTask lastDay = testData.performedTask(client, task, LocalDateTime.of(2026, 11, 30, 23, 59));
        testData.performedTask(client, task, LocalDateTime.of(2026, 10, 31, 23, 59));
        testData.performedTask(client, task, LocalDateTime.of(2026, 12, 1, 0, 0));
        testData.performedTask(client, task, LocalDateTime.of(2025, 11, 15, 10, 0));

        assertThat(listedIds(coordinator, "month", "11", "year", "2026"))
                .containsExactlyInAnyOrder(firstMoment.getId(), lastDay.getId());
        assertThat(listedIds(coordinator)).hasSize(5);
    }

    @Test
    void monthFilterCombinesWithClientAndCaregiverFilters() throws Exception {
        Client otherClient = testData.client(colleague);
        PerformedTask wanted = testData.performedTask(client, task, LocalDateTime.of(2026, 11, 5, 8, 0), 60, colleague);
        testData.performedTask(client, task, LocalDateTime.of(2026, 11, 6, 8, 0));
        testData.performedTask(otherClient, task, LocalDateTime.of(2026, 11, 5, 8, 0));
        testData.performedTask(client, task, LocalDateTime.of(2026, 10, 5, 8, 0), 60, colleague);

        assertThat(listedIds(coordinator, "month", "11", "year", "2026",
                "clientId", client.getId().toString(), "caregiverIds", colleague.getId().toString()))
                .containsExactly(wanted.getId());
    }

    @Test
    @Disabled("Nález: úkon z katalogu, který byl deaktivován, jde backendem dál zapisovat (formulář nabízí jen aktivní úkony)")
    void inactiveTaskCannotBeRecorded() throws Exception {
        task.setActive(false);
        taskRepository.save(task);

        perform(coordinator, post("/api/performed-tasks"), request(client, task, caregiver))
                .andExpect(status().isBadRequest());

        assertThat(performedTaskRepository.count()).isZero();
    }

    @Test
    @Disabled("Nález: ukončenému klientovi jde backendem zapsat nový úkon (formulář nabízí jen aktivní klienty)")
    void newRecordCannotBeCreatedForTerminatedClient() throws Exception {
        client.setActive(false);
        clientRepository.save(client);

        perform(coordinator, post("/api/performed-tasks"), request(client, task, caregiver))
                .andExpect(status().isBadRequest());

        assertThat(performedTaskRepository.count()).isZero();
    }

    @Test
    @Disabled("Nález: ukončený zaměstnanec jde backendem přidat mezi pečovatele (formulář nabízí jen aktivní)")
    void terminatedEmployeeCannotBeAddedAsCaregiver() throws Exception {
        colleague.setActive(false);
        employeeRepository.save(colleague);

        perform(coordinator, post("/api/performed-tasks"), request(client, task, caregiver, colleague))
                .andExpect(status().isBadRequest());

        assertThat(performedTaskRepository.count()).isZero();
    }

    @ParameterizedTest
    @ValueSource(doubles = {0, -30})
    void amountMustBePositive(double unitCount) throws Exception {
        Map<String, Object> request = request(client, task, caregiver);
        request.put("unitCount", unitCount);

        perform(coordinator, post("/api/performed-tasks"), request).andExpect(status().isBadRequest());

        assertThat(performedTaskRepository.count()).isZero();
    }

    @Test
    void occurrenceCountMustBeWholeNumber() throws Exception {
        Task visit = testData.task(organization, UnitType.OCCURRENCE, 40);
        Map<String, Object> request = request(client, visit, caregiver);
        request.put("unitCount", 1.5);

        perform(coordinator, post("/api/performed-tasks"), request).andExpect(status().isBadRequest());

        assertThat(performedTaskRepository.count()).isZero();
    }

    @Test
    @Disabled("Nález: backend přijme úkon s datem v budoucnosti (formulář ho odmítne)")
    void recordCannotBeInFuture() throws Exception {
        clock.fixAt(LocalDateTime.of(2026, 11, 3, 9, 0));

        perform(coordinator, post("/api/performed-tasks"), request(client, task, caregiver))
                .andExpect(status().isBadRequest());

        assertThat(performedTaskRepository.count()).isZero();
    }

    @Test
    void recordNeedsAtLeastOneCaregiver() throws Exception {
        Map<String, Object> withoutCaregivers = request(client, task);
        withoutCaregivers.remove("caregiverIds");

        perform(coordinator, post("/api/performed-tasks"), request(client, task))
                .andExpect(status().isBadRequest());
        perform(coordinator, post("/api/performed-tasks"), withoutCaregivers)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Úkon musí mít alespoň jednoho pečovatele"));

        assertThat(performedTaskRepository.count()).isZero();
    }

    @Test
    @Disabled("Nález: SUPERADMIN zapíše klientovi úkon z katalogu jiné organizace; kontrola organizace úkonu se pro něj přeskakuje")
    void taskMustComeFromClientsOrganization() throws Exception {
        Task otherOrganizationTask = testData.task(testData.organization());

        perform(testData.superadmin(), post("/api/performed-tasks"), request(client, otherOrganizationTask, caregiver))
                .andExpect(status().isBadRequest());

        assertThat(performedTaskRepository.count()).isZero();
    }

    private List<Long> caregiverIdsOf(long performedTaskId) {
        return jdbcTemplate.queryForList(
                "SELECT caregiver_id FROM caregiver_performed_task WHERE performed_task_id = ?", Long.class, performedTaskId);
    }

    private List<Long> listedIds(Employee viewer, String... params) throws Exception {
        MockHttpServletRequestBuilder request = get("/api/performed-tasks");
        for (int i = 0; i < params.length; i += 2) {
            request.param(params[i], params[i + 1]);
        }
        String body = mockMvc.perform(request.with(loggedInAs(viewer)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<Number> ids = JsonPath.read(body, "$[*].id");
        return ids.stream().map(Number::longValue).toList();
    }

    private long createdId(ResultActions result) throws Exception {
        Number id = JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    private ResultActions perform(Employee employee, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(employee)));
    }

    private ResultActions perform(Employee employee, MockHttpServletRequestBuilder request, Map<String, Object> body) throws Exception {
        return perform(employee.getUser(), request, body);
    }

    private ResultActions perform(User account, MockHttpServletRequestBuilder request, Map<String, Object> body) throws Exception {
        return mockMvc.perform(request.contentType(MediaType.APPLICATION_JSON).content(json(body)).with(loggedInAs(account)));
    }

    private static Map<String, Object> request(Client client, Task task, Employee... caregivers) {
        Map<String, Object> request = new HashMap<>();
        request.put("date", "2026-11-03T10:00:00");
        request.put("unitCount", 30.0);
        request.put("clientId", client.getId());
        request.put("taskId", task.getId());
        request.put("caregiverIds", Stream.of(caregivers).map(Employee::getId).toList());
        return request;
    }
}
