package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.TestData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.ResultActions;

import static cz.zcu.kiv.caretracker.support.FormLogin.login;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * {@code GET /api/auth-status} restores the frontend's auth context on every page load, so it must answer
 * 200 for everyone and carry the fields {@code AuthContext.checkAuth} reads for the signed-in user.
 */
class AuthStatusIT extends AbstractIntegrationTest {

    private Department department;
    private Employee caregiver;

    @BeforeEach
    void createCaregiver() {
        department = testData.department(testData.organization());
        caregiver = testData.withPicture(testData.employee(department, EmployeeRole.CAREGIVER));
    }

    @Test
    void anonymousIsNotLoggedIn() throws Exception {
        mockMvc.perform(get("/api/auth-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isLoggedIn").value(false))
                .andExpect(jsonPath("$.username").doesNotExist());
    }

    @Test
    void employeeGetsEmployeeAndOrganizationContext() throws Exception {
        authStatusAfterLogin(caregiver.getUser())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isLoggedIn").value(true))
                .andExpect(jsonPath("$.username").value(caregiver.getUser().getUsername()))
                .andExpect(jsonPath("$.role").value("CAREGIVER"))
                .andExpect(jsonPath("$.fullName").value(caregiver.getFullName()))
                .andExpect(jsonPath("$.employeeId").value(caregiver.getId()))
                .andExpect(jsonPath("$.employeeRole").value("CAREGIVER"))
                .andExpect(jsonPath("$.departmentId").value(department.getId()))
                .andExpect(jsonPath("$.organizationId").value(department.getOrganization().getId()))
                .andExpect(jsonPath("$.pictureId").value(caregiver.getPictureId()))
                .andExpect(jsonPath("$.clientId").doesNotExist());
    }

    @Test
    void clientGetsOwnClientIdWithoutEmployeeContext() throws Exception {
        Client client = testData.client(caregiver);
        User clientAccount = testData.clientAccount(client);

        authStatusAfterLogin(clientAccount)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isLoggedIn").value(true))
                .andExpect(jsonPath("$.username").value(clientAccount.getUsername()))
                .andExpect(jsonPath("$.role").value("CLIENT"))
                .andExpect(jsonPath("$.clientId").value(client.getId()))
                .andExpect(jsonPath("$.fullName").value(client.getFullName()))
                .andExpect(jsonPath("$.employeeId").doesNotExist())
                .andExpect(jsonPath("$.departmentId").doesNotExist())
                .andExpect(jsonPath("$.organizationId").doesNotExist());
    }

    @Test
    void superadminHasNoOrganization() throws Exception {
        User superadmin = testData.superadmin();

        authStatusAfterLogin(superadmin)
                .andExpect(jsonPath("$.isLoggedIn").value(true))
                .andExpect(jsonPath("$.role").value("SUPERADMIN"))
                .andExpect(jsonPath("$.organizationId").doesNotExist())
                .andExpect(jsonPath("$.employeeId").doesNotExist());
    }

    @Test
    void employeeWithoutPictureGetsNullPictureId() throws Exception {
        Employee withoutPicture = testData.employee(department, EmployeeRole.COORDINATOR);

        authStatusAfterLogin(withoutPicture.getUser())
                .andExpect(jsonPath("$.pictureId").value(nullValue()));
    }

    private ResultActions authStatusAfterLogin(User account) throws Exception {
        MockHttpSession session = (MockHttpSession) mockMvc.perform(login(account.getUsername(), TestData.PASSWORD))
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession(false);
        return mockMvc.perform(get("/api/auth-status").session(session));
    }
}
