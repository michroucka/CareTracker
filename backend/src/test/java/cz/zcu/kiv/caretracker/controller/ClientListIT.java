package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** GET /api/clients sends only what the list and the forms read; the detail has the rest. */
class ClientListIT extends AbstractIntegrationTest {

    @Autowired
    private ClientRepository clientRepository;

    @Test
    void listSendsPlanTaskIdsAndAccountStateWithoutDetailFields() throws Exception {
        Organization organization = testData.organization();
        Department department = testData.department(organization);
        Employee coordinator = testData.employee(department, EmployeeRole.COORDINATOR);
        Task shopping = testData.task(organization);
        Task cleaning = testData.task(organization);
        Client client = testData.client(testData.employee(department, EmployeeRole.CAREGIVER));
        client.setTasks(new ArrayList<>(List.of(shopping, cleaning)));
        clientRepository.save(client);
        testData.clientAccount(client);

        mockMvc.perform(get("/api/clients").with(loggedInAs(coordinator)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", contains(client.getId().intValue())))
                .andExpect(jsonPath("$[0].taskIds[*]", containsInAnyOrder(shopping.getId().intValue(), cleaning.getId().intValue())))
                .andExpect(jsonPath("$[0].userAccountActive").value(true))
                .andExpect(jsonPath("$[0].department.id").value(department.getId()))
                .andExpect(jsonPath("$[0]", not(hasKey("tasks"))))
                .andExpect(jsonPath("$[0]", not(hasKey("gender"))));
    }
}
