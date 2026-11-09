package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.DailyRecord;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.IndividualPlan;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** A terminated client's individual plan is read-only: it can be viewed but not created or changed. */
class InactiveClientPlanIT extends AbstractIntegrationTest {

    private static final String READ_ONLY_MESSAGE = "Klient je ukončený, individuální plán už nelze měnit";
    private static final Map<String, String> PLAN_CONTENT = Map.of("processedDate", "2026-11-01", "plannedUpdateDate", "2027-05-01");

    @Autowired
    private ClientRepository clientRepository;

    private Employee caregiver;
    private Client client;

    @BeforeEach
    void createTerminatedClient() {
        caregiver = testData.employee(testData.department(testData.organization()), EmployeeRole.CAREGIVER);
        client = testData.client(caregiver);
        client.setActive(false);
        client = clientRepository.save(client);
    }

    @Test
    void planCannotBeCreated() throws Exception {
        mockMvc.perform(post("/api/clients/{id}/individual-plan", client.getId()).with(loggedInAs(caregiver))
                        .contentType(MediaType.APPLICATION_JSON).content(json(PLAN_CONTENT)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(READ_ONLY_MESSAGE));
    }

    @Test
    void planCannotGetNewVersion() throws Exception {
        testData.individualPlan(client);

        mockMvc.perform(put("/api/clients/{id}/individual-plan", client.getId()).with(loggedInAs(caregiver))
                        .contentType(MediaType.APPLICATION_JSON).content(json(PLAN_CONTENT)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(READ_ONLY_MESSAGE));
    }

    @Test
    void dailyRecordCannotBeAdded() throws Exception {
        testData.individualPlan(client);

        mockMvc.perform(post("/api/clients/{id}/individual-plan/daily-records", client.getId()).with(loggedInAs(caregiver))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("date", "2026-11-03", "content", "Návštěva"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(READ_ONLY_MESSAGE));
    }

    @Test
    void dailyRecordCannotBeRemoved() throws Exception {
        IndividualPlan plan = testData.individualPlan(client);
        DailyRecord dailyRecord = testData.dailyRecord(plan, caregiver);

        mockMvc.perform(delete("/api/clients/{id}/individual-plan/daily-records/{recordId}", client.getId(), dailyRecord.getId())
                        .with(loggedInAs(caregiver)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(READ_ONLY_MESSAGE));
    }

    @Test
    void planStaysReadable() throws Exception {
        testData.individualPlan(client);

        mockMvc.perform(get("/api/clients/{id}/individual-plan", client.getId()).with(loggedInAs(caregiver)))
                .andExpect(status().isOk());
    }
}
