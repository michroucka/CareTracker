package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Creating a client with incomplete or invalid data through the real service and mapper:
 * the request is rejected with 400, nothing is stored and the message does not name Java classes.
 */
class ClientCreateValidationIT extends AbstractIntegrationTest {

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

    @Test
    void unknownGenderIsRejected() throws Exception {
        createClient(validRequestWith("gender", "ALIEN"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Neplatná hodnota v požadavku"));

        assertThat(clientRepository.findAll()).isEmpty();
    }

    @Test
    void unknownBenefitLevelIsRejected() throws Exception {
        createClient(validRequestWith("benefits", "TEN"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Neplatná hodnota v požadavku"));

        assertThat(clientRepository.findAll()).isEmpty();
    }

    @Test
    void missingGenderIsRejected() throws Exception {
        createClient(validRequestWith("gender", null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Prosím vyberte pohlaví"));
    }

    @Test
    void missingTaskIdsMeanNoTasks() throws Exception {
        createClient(validRequestWith("taskIds", null))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    void missingDepartmentIsRejected() throws Exception {
        createClient(validRequestWith("departmentId", null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Prosím vyberte středisko"));
    }

    private ResultActions createClient(Map<String, Object> request) throws Exception {
        return mockMvc.perform(post("/api/clients").contentType(MediaType.APPLICATION_JSON)
                .content(json(request))
                .with(loggedInAs(coordinator)));
    }

    private Map<String, Object> validRequestWith(String field, Object value) {
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
        request.put(field, value);
        return request;
    }
}
