package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The personal number goes into the 10-digit payment variable symbol after year and month (YYMM),
 * so only numbers from 1 to 999 999 are accepted.
 */
class ClientPersonalNumberIT extends AbstractIntegrationTest {

    @Autowired
    private ClientRepository clientRepository;

    private Employee coordinator;
    private Employee caregiver;

    @BeforeEach
    void setUp() {
        Department department = testData.department(testData.organization());
        coordinator = testData.employee(department, EmployeeRole.COORDINATOR);
        caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
    }

    @ParameterizedTest
    @ValueSource(longs = {1, 999_999})
    void personalNumberUpToSixDigitsIsAccepted(long personalNumber) throws Exception {
        mockMvc.perform(post("/api/clients").contentType(MediaType.APPLICATION_JSON)
                        .content(json(clientRequest(personalNumber)))
                        .with(loggedInAs(coordinator)))
                .andExpect(status().is2xxSuccessful());

        assertThat(clientRepository.findAll()).extracting(Client::getPersonalNumber).containsExactly(personalNumber);
    }

    @ParameterizedTest
    @ValueSource(longs = {0, -5, 1_000_000})
    void personalNumberOutsideRangeIsRejectedOnCreate(long personalNumber) throws Exception {
        mockMvc.perform(post("/api/clients").contentType(MediaType.APPLICATION_JSON)
                        .content(json(clientRequest(personalNumber)))
                        .with(loggedInAs(coordinator)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Osobní číslo musí být mezi 1 a 999999"));
    }

    @ParameterizedTest
    @ValueSource(longs = {0, 1_000_000})
    void personalNumberOutsideRangeIsRejectedOnUpdate(long personalNumber) throws Exception {
        Long clientId = testData.client(caregiver).getId();

        mockMvc.perform(put("/api/clients/" + clientId).contentType(MediaType.APPLICATION_JSON)
                        .content(json(clientRequest(personalNumber)))
                        .with(loggedInAs(coordinator)))
                .andExpect(status().isBadRequest());
    }

    private Map<String, Object> clientRequest(long personalNumber) {
        Map<String, Object> request = new HashMap<>(Map.ofEntries(
                Map.entry("firstName", "Marie"),
                Map.entry("lastName", "Nová"),
                Map.entry("gender", "FEMALE"),
                Map.entry("dateOfBirth", "1948-03-12"),
                Map.entry("street", "Americká 12"),
                Map.entry("city", "Plzeň"),
                Map.entry("postalCode", "301 00"),
                Map.entry("legallyCompetent", true),
                Map.entry("benefits", "THREE"),
                Map.entry("departmentId", caregiver.getDepartment().getId()),
                Map.entry("caregiverId", caregiver.getId()),
                Map.entry("taskIds", List.of())));
        request.put("personalNumber", personalNumber);
        return request;
    }
}
