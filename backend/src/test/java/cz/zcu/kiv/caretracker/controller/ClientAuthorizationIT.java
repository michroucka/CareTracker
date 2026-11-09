package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ClientAuthorizationIT extends AbstractIntegrationTest {

    enum OutsideCaregiver { OTHER_DEPARTMENT, OTHER_ORGANIZATION }

    private Employee caregiverOfClient;
    private Employee caregiverFromOtherDept;
    private Employee caregiverFromOtherOrg;
    private Client client;

    @BeforeEach
    void createClientAndCaregivers() {
        Organization clientOrg = testData.organization();
        Organization otherOrg = testData.organization();
        Department clientDept = testData.department(clientOrg);
        Department otherDept = testData.department(clientOrg);
        Department otherOrgDept = testData.department(otherOrg);

        caregiverOfClient = testData.employee(clientDept, EmployeeRole.CAREGIVER);
        caregiverFromOtherDept = testData.employee(otherDept, EmployeeRole.CAREGIVER);
        caregiverFromOtherOrg = testData.employee(otherOrgDept, EmployeeRole.CAREGIVER);
        client = testData.client(caregiverOfClient);
    }

    @Test
    void caregiverCanReadOwnClient() throws Exception {
        mockMvc.perform(get("/api/clients/{id}", client.getId()).with(loggedInAs(caregiverOfClient)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(client.getId()));
    }

    @ParameterizedTest(name = "caregiver from {0}")
    @EnumSource(OutsideCaregiver.class)
    void caregiverCannotReadClientOutsideOwnDepartment(OutsideCaregiver outsideCaregiver) throws Exception {
        Employee caregiver = switch (outsideCaregiver) {
            case OTHER_DEPARTMENT -> caregiverFromOtherDept;
            case OTHER_ORGANIZATION -> caregiverFromOtherOrg;
        };

        mockMvc.perform(get("/api/clients/{id}", client.getId()).with(loggedInAs(caregiver)))
                .andExpect(status().isForbidden());
    }
}
