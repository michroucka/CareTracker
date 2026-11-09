package cz.zcu.kiv.caretracker.service;

import com.jayway.jsonpath.JsonPath;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.OrganizationRepository;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Organization lifecycle (superadmin only): the manager gets the ADMIN account and the replaced one falls back,
 * termination blocks every account of the organization and activation deliberately leaves them blocked.
 */
class OrganizationLifecycleIT extends AbstractIntegrationTest {

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private UserRepository userRepository;

    private User superadmin;
    private Organization organization;
    private Department department;
    private Employee caregiver;
    private Client client;
    private User clientAccount;

    @BeforeEach
    void createOrganization() {
        superadmin = testData.superadmin();
        organization = testData.organization();
        department = testData.department(organization);
        caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        client = testData.client(caregiver);
        clientAccount = testData.clientAccount(client);
    }

    @Test
    void newOrganizationIsActiveAndKeepsBankAccount() throws Exception {
        Map<String, Object> request = organizationRequest(null);
        request.put("accountPrefix", "19");
        request.put("accountNumber", "2000145399");
        request.put("bankCode", "0800");

        long id = createdId(perform(post("/api/organizations"), request).andExpect(status().isOk()));

        Organization saved = organizationRepository.findById(id).orElseThrow();
        assertThat(saved.getName()).isEqualTo("Pečovatelská služba Plzeň");
        assertThat(saved.getActive()).isTrue();
        assertThat(saved.getAccountPrefix()).isEqualTo("19");
        assertThat(saved.getAccountNumber()).isEqualTo("2000145399");
        assertThat(saved.getBankCode()).isEqualTo("0800");
        assertThat(saved.getManager()).isNull();
    }

    @Test
    void managerGetsAdminAccount() throws Exception {
        perform(put("/api/organizations/{id}", organization.getId()), organizationRequest(caregiver)).andExpect(status().isOk());

        assertThat(organizationRepository.findById(organization.getId()).orElseThrow().getManager().getId()).isEqualTo(caregiver.getId());
        assertRoles(caregiver, EmployeeRole.MANAGER, UserRole.ADMIN);
    }

    @Test
    void replacedManagerFallsBackToCaregiver() throws Exception {
        Employee next = testData.employee(department, EmployeeRole.CAREGIVER);
        perform(put("/api/organizations/{id}", organization.getId()), organizationRequest(caregiver)).andExpect(status().isOk());

        perform(put("/api/organizations/{id}", organization.getId()), organizationRequest(next)).andExpect(status().isOk());

        assertRoles(caregiver, EmployeeRole.CAREGIVER, UserRole.CAREGIVER);
        assertRoles(next, EmployeeRole.MANAGER, UserRole.ADMIN);
    }

    @Test
    void replacedManagerWhoCoordinatesDepartmentFallsBackToCoordinator() throws Exception {
        department.setCoordinator(caregiver);
        departmentRepository.save(department);
        perform(put("/api/organizations/{id}", organization.getId()), organizationRequest(caregiver)).andExpect(status().isOk());

        perform(put("/api/organizations/{id}", organization.getId()), organizationRequest(null)).andExpect(status().isOk());

        assertRoles(caregiver, EmployeeRole.COORDINATOR, UserRole.COORDINATOR);
    }

    @Test
    void terminationBlocksAccountsOfEmployeesAndClients() throws Exception {
        Employee pending = testData.withPendingAccount(testData.employee(department, EmployeeRole.CAREGIVER));

        perform(put("/api/organizations/{id}/terminate", organization.getId())).andExpect(status().isOk());

        assertThat(organizationRepository.findById(organization.getId()).orElseThrow().getActive()).isFalse();
        assertThat(accountActive(caregiver.getUser())).isFalse();
        assertThat(accountActive(pending.getUser())).isFalse();
        assertThat(accountActive(clientAccount)).isFalse();
    }

    @Test
    void terminationLeavesRecordsOfPeopleAndOtherOrganizationsAlone() throws Exception {
        Employee otherOrganizationCaregiver = testData.employee(testData.department(testData.organization()), EmployeeRole.CAREGIVER);

        perform(put("/api/organizations/{id}/terminate", organization.getId())).andExpect(status().isOk());

        assertThat(employeeRepository.findById(caregiver.getId()).orElseThrow().getActive()).isTrue();
        assertThat(clientRepository.findById(client.getId()).orElseThrow().getActive()).isTrue();
        assertThat(departmentRepository.findById(department.getId()).orElseThrow().getActive()).isTrue();
        assertThat(accountActive(otherOrganizationCaregiver.getUser())).isTrue();
        assertThat(accountActive(superadmin)).isTrue();
    }

    @Test
    void activationLeavesAccountsBlocked() throws Exception {
        perform(put("/api/organizations/{id}/terminate", organization.getId())).andExpect(status().isOk());

        perform(put("/api/organizations/{id}/activate", organization.getId())).andExpect(status().isOk());

        assertThat(organizationRepository.findById(organization.getId()).orElseThrow().getActive()).isTrue();
        assertThat(accountActive(caregiver.getUser())).isFalse();
        assertThat(accountActive(clientAccount)).isFalse();
    }

    @Test
    void blockedAccountIsUnblockedByActivatingTheEmployee() throws Exception {
        perform(put("/api/organizations/{id}/terminate", organization.getId())).andExpect(status().isOk());
        perform(put("/api/organizations/{id}/activate", organization.getId())).andExpect(status().isOk());

        perform(put("/api/employees/{id}/activate", caregiver.getId())).andExpect(status().isOk());

        assertThat(accountActive(caregiver.getUser())).isTrue();
    }

    @Test
    void updateCannotDeactivateOrganization() throws Exception {
        Map<String, Object> request = organizationRequest(null);
        request.put("active", false);

        perform(put("/api/organizations/{id}", organization.getId()), request).andExpect(status().isOk());

        assertThat(organizationRepository.findById(organization.getId()).orElseThrow().getActive()).isTrue();
    }

    private boolean accountActive(User account) {
        return userRepository.findById(account.getId()).orElseThrow().getActive();
    }

    private void assertRoles(Employee employee, EmployeeRole employeeRole, UserRole accountRole) {
        Employee saved = employeeRepository.findById(employee.getId()).orElseThrow();
        assertThat(saved.getRole()).isEqualTo(employeeRole);
        assertThat(saved.getUser().getRole()).isEqualTo(accountRole);
    }

    private long createdId(ResultActions result) throws Exception {
        Number id = JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    private ResultActions perform(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(superadmin)));
    }

    private ResultActions perform(MockHttpServletRequestBuilder request, Map<String, Object> body) throws Exception {
        return perform(request.contentType(MediaType.APPLICATION_JSON).content(json(body)));
    }

    private static Map<String, Object> organizationRequest(Employee manager) {
        Map<String, Object> request = new HashMap<>();
        request.put("name", "Pečovatelská služba Plzeň");
        request.put("managerId", manager != null ? manager.getId() : null);
        return request;
    }
}
