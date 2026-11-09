package cz.zcu.kiv.caretracker.controller;

import com.jayway.jsonpath.JsonPath;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.AccessScenario;
import cz.zcu.kiv.caretracker.support.AccessScenario.Actor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.ResultMatcher;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static cz.zcu.kiv.caretracker.support.AccessScenario.Actor.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Who may read and change a department of the scenario's organization. The department under test is empty,
 * so terminating it is not refused for having active clients or employees.
 * Every matrix test runs once per {@link Actor}; allowed actors get 2xx, everyone else 403.
 */
class DepartmentAccessIT extends AbstractIntegrationTest {

    private static final Set<Actor> ORGANIZATION_STAFF = EnumSet.of(SUPERADMIN, ADMIN, COORDINATOR, COORDINATOR_OTHER_DEPT,
            CAREGIVER_OF_CLIENT, CAREGIVER, CAREGIVER_OTHER_DEPT);
    private static final Set<Actor> DEPARTMENT_MANAGERS = EnumSet.of(SUPERADMIN, ADMIN);
    // an admin always creates the department in their own organization, see adminCreatesDepartmentOnlyInOwnOrganization
    private static final Set<Actor> DEPARTMENT_CREATORS = EnumSet.of(SUPERADMIN, ADMIN, ADMIN_OTHER_ORG);

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    private AccessScenario scenario;
    private Department department;

    @BeforeEach
    void createScenario() {
        scenario = new AccessScenario(testData);
        department = testData.department(scenario.organization);
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void readDetail(Actor actor) throws Exception {
        perform(actor, get("/api/departments/{id}", department.getId()))
                .andExpect(allowedOnlyFor(ORGANIZATION_STAFF, actor));
    }

    @Test
    void detailContainsRequestedDepartment() throws Exception {
        perform(CAREGIVER, get("/api/departments/{id}", department.getId()))
                .andExpect(jsonPath("$.id").value(department.getId()));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void createDepartment(Actor actor) throws Exception {
        perform(actor, post("/api/departments").contentType(MediaType.APPLICATION_JSON)
                .content(json(departmentRequest(scenario.organization.getId()))))
                .andExpect(allowedOnlyFor(DEPARTMENT_CREATORS, actor));
    }

    @Test
    void adminCreatesDepartmentOnlyInOwnOrganization() throws Exception {
        String response = perform(ADMIN, post("/api/departments").contentType(MediaType.APPLICATION_JSON)
                        .content(json(departmentRequest(scenario.otherOrganization.getId()))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long createdId = ((Number) JsonPath.read(response, "$.id")).longValue();
        assertThat(departmentRepository.findById(createdId)).get()
                .extracting(created -> created.getOrganization().getId())
                .isEqualTo(scenario.organization.getId());
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void updateDepartment(Actor actor) throws Exception {
        perform(actor, put("/api/departments/{id}", department.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(departmentRequest(scenario.organization.getId()))))
                .andExpect(allowedOnlyFor(DEPARTMENT_MANAGERS, actor));
    }

    @Test
    void coordinatorCannotRenameOwnDepartment() throws Exception {
        perform(COORDINATOR, put("/api/departments/{id}", scenario.department.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(departmentRequest(scenario.organization.getId()))))
                .andExpect(status().isForbidden());

        assertThat(departmentRepository.findById(scenario.department.getId())).get()
                .extracting(Department::getCity)
                .isEqualTo(scenario.department.getCity());
    }

    @Test
    void adminCannotMoveDepartmentToOtherOrganization() throws Exception {
        perform(ADMIN, put("/api/departments/{id}", department.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(departmentRequest(scenario.otherOrganization.getId()))));

        assertThat(departmentRepository.findById(department.getId())).get()
                .extracting(saved -> saved.getOrganization().getId())
                .isEqualTo(scenario.organization.getId());
    }

    @Test
    void rejectedUpdateFromOtherOrganizationLeavesDepartmentUnchanged() throws Exception {
        perform(ADMIN_OTHER_ORG, put("/api/departments/{id}", department.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(departmentRequest(scenario.otherOrganization.getId()))))
                .andExpect(status().isForbidden());

        Department saved = departmentRepository.findById(department.getId()).orElseThrow();
        assertThat(saved.getCity()).isEqualTo(department.getCity());
        assertThat(saved.getOrganization().getId()).isEqualTo(scenario.organization.getId());
    }

    @Test
    void adminCannotAssignCoordinatorFromOtherOrganization() throws Exception {
        Employee foreignCaregiver = scenario.employee(CAREGIVER_OTHER_ORG);
        Map<String, Object> request = departmentRequest(scenario.organization.getId());
        request.put("coordinatorId", foreignCaregiver.getId());

        perform(ADMIN, put("/api/departments/{id}", department.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(request)))
                .andExpect(status().isForbidden());

        assertThat(employeeRepository.findById(foreignCaregiver.getId())).get()
                .extracting(Employee::getRole)
                .isEqualTo(EmployeeRole.CAREGIVER);
        assertThat(userRepository.findById(foreignCaregiver.getUser().getId())).get()
                .extracting(account -> account.getRole())
                .isEqualTo(UserRole.CAREGIVER);
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void terminateDepartment(Actor actor) throws Exception {
        perform(actor, put("/api/departments/{id}/terminate", department.getId()))
                .andExpect(allowedOnlyFor(DEPARTMENT_MANAGERS, actor));
    }

    @Test
    void rejectedTerminationLeavesDepartmentActive() throws Exception {
        perform(ADMIN_OTHER_ORG, put("/api/departments/{id}/terminate", department.getId()))
                .andExpect(status().isForbidden());

        assertThat(departmentRepository.findById(department.getId())).get()
                .extracting(Department::getActive)
                .isEqualTo(true);
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void activateDepartment(Actor actor) throws Exception {
        department.setActive(false);
        departmentRepository.save(department);

        perform(actor, put("/api/departments/{id}/activate", department.getId()))
                .andExpect(allowedOnlyFor(DEPARTMENT_MANAGERS, actor));
    }

    @Test
    void updateCannotDeactivateDepartment() throws Exception {
        testData.employee(department, EmployeeRole.CAREGIVER);
        Map<String, Object> request = departmentRequest(scenario.organization.getId());
        request.put("active", false);

        perform(ADMIN, put("/api/departments/{id}", department.getId()).contentType(MediaType.APPLICATION_JSON).content(json(request)))
                .andExpect(status().isOk());

        assertThat(departmentRepository.findById(department.getId())).get()
                .extracting(Department::getActive)
                .isEqualTo(true);
    }

    private ResultActions perform(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(scenario.user(actor))));
    }

    private static ResultMatcher allowedOnlyFor(Set<Actor> allowed, Actor actor) {
        return allowed.contains(actor) ? status().is2xxSuccessful() : status().isForbidden();
    }

    private static Map<String, Object> departmentRequest(Long organizationId) {
        Map<String, Object> request = new HashMap<>();
        request.put("street", "Nová 1");
        request.put("city", "Klatovy");
        request.put("postalCode", "33901");
        request.put("organizationId", organizationId);
        return request;
    }
}
