package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.DailyRecord;
import cz.zcu.kiv.caretracker.entity.IndividualPlan;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.AccessScenario;
import cz.zcu.kiv.caretracker.support.AccessScenario.Actor;
import cz.zcu.kiv.caretracker.support.TestImages;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.ResultMatcher;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static cz.zcu.kiv.caretracker.support.AccessScenario.Actor.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Who may read and change a client and its picture, account and individual plan.
 * Every test runs once per {@link Actor}; allowed actors get 2xx, everyone else 403.
 */
class ClientAccessIT extends AbstractIntegrationTest {

    private static final Set<Actor> CLIENT_DEPARTMENT_STAFF = EnumSet.of(SUPERADMIN, ADMIN, COORDINATOR, CAREGIVER_OF_CLIENT, CAREGIVER);
    private static final Set<Actor> CLIENT_MANAGERS = EnumSet.of(SUPERADMIN, ADMIN, COORDINATOR);
    // individual plan content may be changed only by the client's own caregiver (or admins), not the coordinator
    private static final Set<Actor> PLAN_EDITORS = EnumSet.of(SUPERADMIN, ADMIN, CAREGIVER_OF_CLIENT);
    // daily records need an employee as author, so SUPERADMIN cannot add them
    private static final Set<Actor> DAILY_RECORD_AUTHORS = EnumSet.of(ADMIN, COORDINATOR, CAREGIVER_OF_CLIENT, CAREGIVER);
    // a daily record may be deleted by its author (here CAREGIVER_OF_CLIENT) or an admin
    private static final Set<Actor> DAILY_RECORD_DELETERS = EnumSet.of(SUPERADMIN, ADMIN, CAREGIVER_OF_CLIENT);

    @Autowired
    private ClientRepository clientRepository;

    private AccessScenario scenario;
    private Client client;

    @BeforeEach
    void createScenario() {
        scenario = new AccessScenario(testData);
        client = testData.withPicture(scenario.client);
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void readDetail(Actor actor) throws Exception {
        perform(actor, get("/api/clients/{id}", client.getId()))
                .andExpect(allowedOnlyFor(CLIENT_DEPARTMENT_STAFF, actor));
    }

    @Test
    void detailContainsRequestedClient() throws Exception {
        perform(CAREGIVER_OF_CLIENT, get("/api/clients/{id}", client.getId()))
                .andExpect(jsonPath("$.id").value(client.getId()));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void readPicture(Actor actor) throws Exception {
        perform(actor, get("/api/clients/{id}/picture", client.getId()))
                .andExpect(allowedOnlyFor(CLIENT_DEPARTMENT_STAFF, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void readIndividualPlan(Actor actor) throws Exception {
        testData.individualPlan(client);

        perform(actor, get("/api/clients/{id}/individual-plan", client.getId()))
                .andExpect(allowedOnlyFor(CLIENT_DEPARTMENT_STAFF, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void readIndividualPlanHistory(Actor actor) throws Exception {
        testData.individualPlan(client);

        perform(actor, get("/api/clients/{id}/individual-plan/history", client.getId()))
                .andExpect(allowedOnlyFor(CLIENT_DEPARTMENT_STAFF, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void readIndividualPlanVersion(Actor actor) throws Exception {
        testData.individualPlan(client);

        perform(actor, get("/api/clients/{id}/individual-plan/{version}", client.getId(), 1))
                .andExpect(allowedOnlyFor(CLIENT_DEPARTMENT_STAFF, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void createClient(Actor actor) throws Exception {
        perform(actor, post("/api/clients").contentType(MediaType.APPLICATION_JSON)
                .content(json(clientRequest(scenario.department.getId(), scenario.employee(CAREGIVER_OF_CLIENT).getId()))))
                .andExpect(allowedOnlyFor(CLIENT_MANAGERS, actor));
    }

    @Test
    void coordinatorCannotAssignCaregiverFromOtherOrganization() throws Exception {
        perform(COORDINATOR, post("/api/clients").contentType(MediaType.APPLICATION_JSON)
                .content(json(clientRequest(scenario.department.getId(), scenario.employee(CAREGIVER_OTHER_ORG).getId()))))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void updateClient(Actor actor) throws Exception {
        perform(actor, put("/api/clients/{id}", client.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(clientRequest(client.getDepartment().getId(), client.getCaregiver().getId()))))
                .andExpect(allowedOnlyFor(CLIENT_MANAGERS, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void terminateClient(Actor actor) throws Exception {
        perform(actor, put("/api/clients/{id}/terminate", client.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("terminationDate", "2026-11-01", "terminationReason", "OTHER"))))
                .andExpect(allowedOnlyFor(CLIENT_MANAGERS, actor));
    }

    @Test
    void rejectedTerminationLeavesClientActive() throws Exception {
        perform(COORDINATOR_OTHER_DEPT, put("/api/clients/{id}/terminate", client.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("terminationDate", "2026-11-01", "terminationReason", "OTHER"))))
                .andExpect(status().isForbidden());

        assertThat(clientRepository.findById(client.getId())).get()
                .extracting(Client::getActive)
                .isEqualTo(true);
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void activateClient(Actor actor) throws Exception {
        perform(actor, put("/api/clients/{id}/activate", client.getId()))
                .andExpect(allowedOnlyFor(CLIENT_MANAGERS, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void uploadPicture(Actor actor) throws Exception {
        MockMultipartFile photo = new MockMultipartFile("file", "photo.jpg", "image/jpeg", TestImages.jpeg(64, 64));

        perform(actor, multipart("/api/clients/{id}/picture", client.getId()).file(photo))
                .andExpect(allowedOnlyFor(CLIENT_MANAGERS, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void deletePicture(Actor actor) throws Exception {
        perform(actor, delete("/api/clients/{id}/picture", client.getId()))
                .andExpect(allowedOnlyFor(CLIENT_MANAGERS, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void createAccount(Actor actor) throws Exception {
        Client clientWithoutAccount = testData.client(scenario.employee(CAREGIVER_OF_CLIENT));

        perform(actor, post("/api/clients/{id}/account/create", clientWithoutAccount.getId())
                .param("email", "novy.klient@caretracker.test"))
                .andExpect(allowedOnlyFor(CLIENT_MANAGERS, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void deactivateAccount(Actor actor) throws Exception {
        perform(actor, put("/api/clients/{id}/account/deactivate", client.getId()))
                .andExpect(allowedOnlyFor(CLIENT_MANAGERS, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void activateAccount(Actor actor) throws Exception {
        perform(actor, put("/api/clients/{id}/account/activate", client.getId()))
                .andExpect(allowedOnlyFor(CLIENT_MANAGERS, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void createIndividualPlan(Actor actor) throws Exception {
        perform(actor, post("/api/clients/{id}/individual-plan", client.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(planContentRequest())))
                .andExpect(allowedOnlyFor(PLAN_EDITORS, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void updateIndividualPlan(Actor actor) throws Exception {
        testData.individualPlan(client);

        perform(actor, put("/api/clients/{id}/individual-plan", client.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(planContentRequest())))
                .andExpect(allowedOnlyFor(PLAN_EDITORS, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void addDailyRecord(Actor actor) throws Exception {
        testData.individualPlan(client);

        perform(actor, post("/api/clients/{id}/individual-plan/daily-records", client.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("date", "2026-11-03", "content", "Nákup a úklid"))))
                .andExpect(allowedOnlyFor(DAILY_RECORD_AUTHORS, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void removeDailyRecord(Actor actor) throws Exception {
        IndividualPlan plan = testData.individualPlan(client);
        DailyRecord dailyRecord = testData.dailyRecord(plan, scenario.employee(CAREGIVER_OF_CLIENT));

        perform(actor, delete("/api/clients/{id}/individual-plan/daily-records/{recordId}", client.getId(), dailyRecord.getId()))
                .andExpect(allowedOnlyFor(DAILY_RECORD_DELETERS, actor));
    }

    @Test
    void coordinatorCanRemoveOwnDailyRecord() throws Exception {
        IndividualPlan plan = testData.individualPlan(client);
        DailyRecord dailyRecord = testData.dailyRecord(plan, scenario.employee(COORDINATOR));

        perform(COORDINATOR, delete("/api/clients/{id}/individual-plan/daily-records/{recordId}", client.getId(), dailyRecord.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dailyRecords").isEmpty());
    }

    @Test
    void removingUnknownDailyRecordReturnsNotFound() throws Exception {
        testData.individualPlan(client);

        perform(ADMIN, delete("/api/clients/{id}/individual-plan/daily-records/{recordId}", client.getId(), 999_999))
                .andExpect(status().isNotFound());
    }

    @Test
    void cannotCreateClientAccountWithEmailOfAnotherAccount() throws Exception {
        Client clientWithoutAccount = testData.client(scenario.employee(CAREGIVER_OF_CLIENT));

        perform(ADMIN, post("/api/clients/{id}/account/create", clientWithoutAccount.getId())
                .param("email", scenario.user(CAREGIVER).getEmail()))
                .andExpect(status().isBadRequest());
    }

    private ResultActions perform(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(scenario.user(actor))));
    }

    private static ResultMatcher allowedOnlyFor(Set<Actor> allowed, Actor actor) {
        return allowed.contains(actor) ? status().is2xxSuccessful() : status().isForbidden();
    }

    private static Map<String, Object> clientRequest(Long departmentId, Long caregiverId) {
        return Map.ofEntries(
                Map.entry("firstName", "Marie"),
                Map.entry("lastName", "Nová"),
                Map.entry("gender", "FEMALE"),
                Map.entry("dateOfBirth", "1948-03-12"),
                Map.entry("street", "Americká 12"),
                Map.entry("city", "Plzeň"),
                Map.entry("postalCode", "301 00"),
                Map.entry("legallyCompetent", true),
                Map.entry("benefits", "THREE"),
                Map.entry("departmentId", departmentId),
                Map.entry("caregiverId", caregiverId),
                Map.entry("taskIds", List.of())
        );
    }

    private static Map<String, Object> planContentRequest() {
        return Map.of(
                "processedDate", "2026-11-01",
                "plannedUpdateDate", "2027-05-01",
                "likes", "Procházky v parku"
        );
    }
}
