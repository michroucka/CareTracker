package cz.zcu.kiv.caretracker.controller;

import com.jayway.jsonpath.JsonPath;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.IndividualPlanContent;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.IndividualPlanContentRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.AccessScenario;
import cz.zcu.kiv.caretracker.support.AccessScenario.Actor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import static cz.zcu.kiv.caretracker.support.AccessScenario.Actor.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The dashboard of each view summarizes only records within the user's scope: the organization, the department
 * or the caregiver's own clients. Every caregiver of the scenario has one client with a performed task today and
 * a plan due for an update, and one long-standing client without any record (shown as needing attention).
 */
class DashboardScopeIT extends AbstractIntegrationTest {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private IndividualPlanContentRepository planContentRepository;

    private AccessScenario scenario;
    private final Map<Actor, Client> activeClientOf = new EnumMap<>(Actor.class);
    private final Map<Actor, Client> neglectedClientOf = new EnumMap<>(Actor.class);
    private final Map<Actor, PerformedTask> performedTaskOf = new EnumMap<>(Actor.class);

    @BeforeEach
    void createCaregiversWork() {
        scenario = new AccessScenario(testData);
        Task task = testData.task(scenario.organization);
        Task otherOrganizationTask = testData.task(scenario.otherOrganization);

        addWork(CAREGIVER_OF_CLIENT, scenario.client, task);
        addWork(CAREGIVER, testData.client(scenario.employee(CAREGIVER)), task);
        addWork(CAREGIVER_OTHER_DEPT, testData.client(scenario.employee(CAREGIVER_OTHER_DEPT)), task);
        addWork(CAREGIVER_OTHER_ORG, testData.client(scenario.employee(CAREGIVER_OTHER_ORG)), otherOrganizationTask);
    }

    @Test
    void organizationViewSummarizesOnlyOwnOrganization() throws Exception {
        List<Actor> organizationCaregivers = List.of(CAREGIVER_OF_CLIENT, CAREGIVER, CAREGIVER_OTHER_DEPT);

        String dashboard = dashboard(ADMIN, "ORGANIZATION");

        assertThat(ids(dashboard, "$.recentPerformedTasks[*].id")).containsExactlyInAnyOrderElementsOf(performedTaskIds(organizationCaregivers));
        assertThat(ids(dashboard, "$.clientIPUpdates[*].clientId")).containsExactlyInAnyOrderElementsOf(clientIds(activeClientOf, organizationCaregivers));
        assertThat(ids(dashboard, "$.clientsWithoutRecentRecords[*].clientId")).containsExactlyInAnyOrderElementsOf(clientIds(neglectedClientOf, organizationCaregivers));
        assertThat(JsonPath.<Integer>read(dashboard, "$.clientCount")).isEqualTo(6);
        assertThat(JsonPath.<List<Integer>>read(dashboard, "$.tasksPerformedByDepartment[*].performedTasksCount")).containsExactlyInAnyOrder(2, 1);
    }

    @Test
    void otherOrganizationAdminSeesOnlyTheirOrganization() throws Exception {
        String dashboard = dashboard(ADMIN_OTHER_ORG, "ORGANIZATION");

        assertThat(ids(dashboard, "$.recentPerformedTasks[*].id")).containsExactlyElementsOf(performedTaskIds(List.of(CAREGIVER_OTHER_ORG)));
        assertThat(ids(dashboard, "$.clientsWithoutRecentRecords[*].clientId")).containsExactly(neglectedClientOf.get(CAREGIVER_OTHER_ORG).getId());
        assertThat(JsonPath.<Integer>read(dashboard, "$.clientCount")).isEqualTo(2);
    }

    @Test
    void departmentViewSummarizesOnlyOwnDepartment() throws Exception {
        List<Actor> departmentCaregivers = List.of(CAREGIVER_OF_CLIENT, CAREGIVER);

        String dashboard = dashboard(COORDINATOR, "DEPARTMENT");

        assertThat(ids(dashboard, "$.recentPerformedTasks[*].id")).containsExactlyInAnyOrderElementsOf(performedTaskIds(departmentCaregivers));
        assertThat(ids(dashboard, "$.clientIPUpdates[*].clientId")).containsExactlyInAnyOrderElementsOf(clientIds(activeClientOf, departmentCaregivers));
        assertThat(ids(dashboard, "$.clientsWithoutRecentRecords[*].clientId")).containsExactlyInAnyOrderElementsOf(clientIds(neglectedClientOf, departmentCaregivers));
        assertThat(ids(dashboard, "$.caregiverWorkload[*].employeeId")).containsExactlyInAnyOrder(
                scenario.employee(CAREGIVER_OF_CLIENT).getId(), scenario.employee(CAREGIVER).getId());
        assertThat(JsonPath.<Integer>read(dashboard, "$.clientCount")).isEqualTo(4);
    }

    @Test
    void adminDepartmentViewSummarizesOnlyAdminsDepartment() throws Exception {
        String dashboard = dashboard(ADMIN, "DEPARTMENT");

        assertThat(ids(dashboard, "$.recentPerformedTasks[*].id")).containsExactlyInAnyOrderElementsOf(performedTaskIds(List.of(CAREGIVER_OF_CLIENT, CAREGIVER)));
        assertThat(JsonPath.<Integer>read(dashboard, "$.clientCount")).isEqualTo(4);
    }

    @Test
    void ownWorkViewSummarizesOnlyCaregiversOwnClients() throws Exception {
        String dashboard = dashboard(CAREGIVER_OF_CLIENT, "MINE");

        assertThat(ids(dashboard, "$.recentPerformedTasks[*].id")).containsExactly(performedTaskOf.get(CAREGIVER_OF_CLIENT).getId());
        assertThat(ids(dashboard, "$.clientIPUpdates[*].clientId")).containsExactly(scenario.client.getId());
        assertThat(ids(dashboard, "$.clientsWithoutRecentRecords[*].clientId")).containsExactly(neglectedClientOf.get(CAREGIVER_OF_CLIENT).getId());
        assertThat(JsonPath.<Integer>read(dashboard, "$.myClientsCount")).isEqualTo(2);
        assertThat(JsonPath.<Integer>read(dashboard, "$.todayTasksCount")).isEqualTo(1);
    }

    @Test
    void coordinatorOwnWorkViewIsEmptyWithoutOwnClients() throws Exception {
        String dashboard = dashboard(COORDINATOR, "MINE");

        assertThat(ids(dashboard, "$.recentPerformedTasks[*].id")).isEmpty();
        assertThat(ids(dashboard, "$.clientsWithoutRecentRecords[*].clientId")).isEmpty();
        assertThat(JsonPath.<Integer>read(dashboard, "$.myClientsCount")).isZero();
    }

    @Test
    void platformOverviewListsEveryOrganizationWithoutClientPersonalData() throws Exception {
        String dashboard = dashboard(SUPERADMIN, null);

        assertThat(ids(dashboard, "$.platform.organizations[*].id")).containsExactlyInAnyOrder(
                scenario.organization.getId(), scenario.otherOrganization.getId());
        assertThat(dashboard).doesNotContain(scenario.client.getLastName());
        assertThat(dashboard).doesNotContain(neglectedClientOf.get(CAREGIVER_OTHER_ORG).getLastName());
    }

    private void addWork(Actor caregiver, Client activeClient, Task task) {
        activeClientOf.put(caregiver, activeClient);
        performedTaskOf.put(caregiver, testData.performedTask(activeClient, task, LocalDateTime.now()));
        IndividualPlanContent planContent = testData.individualPlan(activeClient).getCurrentContent();
        planContent.setPlannedUpdateDate(LocalDate.now().plusDays(7));
        planContentRepository.save(planContent);

        Client neglectedClient = testData.client(scenario.employee(caregiver));
        // clients created within the last 14 days are not reported as missing records yet
        neglectedClient.setCreated(LocalDate.now().minusMonths(2));
        neglectedClientOf.put(caregiver, clientRepository.save(neglectedClient));
    }

    private String dashboard(Actor actor, String view) throws Exception {
        var request = get("/api/dashboard").with(loggedInAs(scenario.user(actor)));
        if (view != null) {
            request.param("view", view);
        }
        return mockMvc.perform(request)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    private List<Long> performedTaskIds(List<Actor> caregivers) {
        return caregivers.stream().map(caregiver -> performedTaskOf.get(caregiver).getId()).toList();
    }

    private static List<Long> clientIds(Map<Actor, Client> clientsByCaregiver, List<Actor> caregivers) {
        return caregivers.stream().map(caregiver -> clientsByCaregiver.get(caregiver).getId()).toList();
    }

    private static List<Long> ids(String json, String path) {
        List<Number> values = JsonPath.read(json, path);
        return values.stream().map(Number::longValue).toList();
    }
}
