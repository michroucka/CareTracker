package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.UserRepository;
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
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static cz.zcu.kiv.caretracker.support.AccessScenario.Actor.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Who may read and change an employee (a caregiver in the scenario's department) and its picture.
 * Every test runs once per {@link Actor}; allowed actors get 2xx, everyone else 403.
 */
class EmployeeAccessIT extends AbstractIntegrationTest {

    private static final Set<Actor> DEPARTMENT_STAFF = EnumSet.of(SUPERADMIN, ADMIN, COORDINATOR, CAREGIVER_OF_CLIENT, CAREGIVER);
    private static final Set<Actor> EMPLOYEE_MANAGERS = EnumSet.of(SUPERADMIN, ADMIN, COORDINATOR);

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    private AccessScenario scenario;
    private Employee employee;

    @BeforeEach
    void createScenario() {
        scenario = new AccessScenario(testData);
        employee = testData.withPicture(testData.employee(scenario.department, EmployeeRole.CAREGIVER));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void readDetail(Actor actor) throws Exception {
        perform(actor, get("/api/employees/{id}", employee.getId()))
                .andExpect(allowedOnlyFor(DEPARTMENT_STAFF, actor));
    }

    @Test
    void detailContainsRequestedEmployee() throws Exception {
        perform(CAREGIVER, get("/api/employees/{id}", employee.getId()))
                .andExpect(jsonPath("$.id").value(employee.getId()));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void readPicture(Actor actor) throws Exception {
        perform(actor, get("/api/employees/{id}/picture", employee.getId()))
                .andExpect(allowedOnlyFor(DEPARTMENT_STAFF, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void createEmployee(Actor actor) throws Exception {
        perform(actor, post("/api/employees").contentType(MediaType.APPLICATION_JSON)
                .content(json(employeeRequest("CAREGIVER", scenario.department.getId()))))
                .andExpect(allowedOnlyFor(EMPLOYEE_MANAGERS, actor));
    }

    @Test
    void coordinatorCannotCreateEmployeeInOtherDepartment() throws Exception {
        perform(COORDINATOR, post("/api/employees").contentType(MediaType.APPLICATION_JSON)
                .content(json(employeeRequest("CAREGIVER", scenario.otherDepartment.getId()))))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void updateEmployee(Actor actor) throws Exception {
        perform(actor, put("/api/employees/{id}", employee.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(employeeRequest("CAREGIVER", scenario.department.getId()))))
                .andExpect(allowedOnlyFor(EMPLOYEE_MANAGERS, actor));
    }

    @Test
    void coordinatorCannotMoveEmployeeToOtherDepartment() throws Exception {
        perform(COORDINATOR, put("/api/employees/{id}", employee.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(employeeRequest("CAREGIVER", scenario.otherDepartment.getId()))))
                .andExpect(status().isForbidden());

        assertThat(employeeRepository.findById(employee.getId())).get()
                .extracting(saved -> saved.getDepartment().getId())
                .isEqualTo(scenario.department.getId());
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void terminateEmployee(Actor actor) throws Exception {
        perform(actor, put("/api/employees/{id}/terminate", employee.getId()))
                .andExpect(allowedOnlyFor(EMPLOYEE_MANAGERS, actor));
    }

    @Test
    void rejectedTerminationLeavesEmployeeAndAccountActive() throws Exception {
        perform(COORDINATOR_OTHER_DEPT, put("/api/employees/{id}/terminate", employee.getId()))
                .andExpect(status().isForbidden());

        Employee saved = employeeRepository.findById(employee.getId()).orElseThrow();
        assertThat(saved.getActive()).isTrue();
        assertThat(userRepository.findById(employee.getUser().getId())).get()
                .extracting(account -> account.getActive())
                .isEqualTo(true);
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void activateEmployee(Actor actor) throws Exception {
        perform(actor, put("/api/employees/{id}/activate", employee.getId()))
                .andExpect(allowedOnlyFor(EMPLOYEE_MANAGERS, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void resendActivationEmail(Actor actor) throws Exception {
        testData.withPendingAccount(employee);

        perform(actor, post("/api/employees/{id}/resend", employee.getId()))
                .andExpect(allowedOnlyFor(EMPLOYEE_MANAGERS, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void uploadPicture(Actor actor) throws Exception {
        MockMultipartFile photo = new MockMultipartFile("file", "photo.jpg", "image/jpeg", TestImages.jpeg(64, 64));

        perform(actor, multipart("/api/employees/{id}/picture", employee.getId()).file(photo))
                .andExpect(allowedOnlyFor(EMPLOYEE_MANAGERS, actor));
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void deletePicture(Actor actor) throws Exception {
        perform(actor, delete("/api/employees/{id}/picture", employee.getId()))
                .andExpect(allowedOnlyFor(EMPLOYEE_MANAGERS, actor));
    }

    @Test
    void coordinatorCannotCreateAdminAccount() throws Exception {
        Map<String, Object> request = employeeRequest("CAREGIVER", scenario.department.getId());
        request.put("email", "novy.admin@caretracker.test");
        request.put("isAdmin", true);

        perform(COORDINATOR, post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(json(request)))
                .andExpect(status().isForbidden());

        assertThat(userRepository.findAll()).noneMatch(account -> "novy.admin@caretracker.test".equals(account.getEmail()));
    }

    @ParameterizedTest
    @EnumSource(value = EmployeeRole.class, names = {"COORDINATOR", "MANAGER"})
    void coordinatorCannotCreateEmployeeWithHigherRole(EmployeeRole role) throws Exception {
        perform(COORDINATOR, post("/api/employees").contentType(MediaType.APPLICATION_JSON)
                .content(json(employeeRequest(role.name(), scenario.department.getId()))))
                .andExpect(status().isForbidden());
    }

    @Test
    void coordinatorCannotMakeThemselvesAdmin() throws Exception {
        Employee coordinator = scenario.employee(COORDINATOR);
        Map<String, Object> request = employeeRequest("COORDINATOR", scenario.department.getId());
        request.put("email", coordinator.getUser().getEmail());
        request.put("isAdmin", true);

        perform(COORDINATOR, put("/api/employees/{id}", coordinator.getId()).contentType(MediaType.APPLICATION_JSON).content(json(request)))
                .andExpect(status().isForbidden());

        assertThat(userRepository.findById(coordinator.getUser().getId())).get()
                .extracting(account -> account.getRole())
                .isEqualTo(UserRole.COORDINATOR);
    }

    @Test
    void coordinatorCannotChangeAdminEmail() throws Exception {
        Employee admin = scenario.employee(ADMIN);
        Map<String, Object> request = employeeRequest("MANAGER", scenario.department.getId());
        request.put("email", "koordinator@caretracker.test");
        request.put("isAdmin", false);

        perform(COORDINATOR, put("/api/employees/{id}", admin.getId()).contentType(MediaType.APPLICATION_JSON).content(json(request)))
                .andExpect(status().isForbidden());

        assertThat(userRepository.findById(admin.getUser().getId())).get()
                .extracting(account -> account.getEmail())
                .isEqualTo(admin.getUser().getEmail());
    }

    @Test
    void coordinatorCanKeepRoleOfCoordinator() throws Exception {
        Employee otherCoordinator = testData.employee(scenario.department, EmployeeRole.COORDINATOR);

        perform(COORDINATOR, put("/api/employees/{id}", otherCoordinator.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(json(employeeRequest("COORDINATOR", scenario.department.getId()))))
                .andExpect(status().isOk());
    }

    @Test
    void coordinatorCannotTerminateAdmin() throws Exception {
        perform(COORDINATOR, put("/api/employees/{id}/terminate", scenario.employee(ADMIN).getId()))
                .andExpect(status().isForbidden());

        assertThat(employeeRepository.findById(scenario.employee(ADMIN).getId())).get()
                .extracting(Employee::getActive)
                .isEqualTo(true);
    }

    @Test
    void adminCanGrantAdminAccount() throws Exception {
        Map<String, Object> request = employeeRequest("COORDINATOR", scenario.department.getId());
        request.put("email", "novy.admin@caretracker.test");
        request.put("isAdmin", true);

        perform(ADMIN, post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(json(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isAdmin").value(true));
    }

    @Test
    void cannotCreateAccountWithEmailOfAnotherAccount() throws Exception {
        Map<String, Object> request = employeeRequest("CAREGIVER", scenario.department.getId());
        request.put("email", scenario.user(CAREGIVER).getEmail().toUpperCase());
        request.put("isAdmin", false);

        perform(ADMIN, post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(json(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void employeeKeepsOwnEmailOnUpdate() throws Exception {
        Employee caregiver = scenario.employee(CAREGIVER);
        Map<String, Object> request = employeeRequest("CAREGIVER", scenario.department.getId());
        request.put("email", caregiver.getUser().getEmail());
        request.put("isAdmin", false);

        perform(ADMIN, put("/api/employees/{id}", caregiver.getId()).contentType(MediaType.APPLICATION_JSON).content(json(request)))
                .andExpect(status().isOk());
    }

    private ResultActions perform(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(scenario.user(actor))));
    }

    private static ResultMatcher allowedOnlyFor(Set<Actor> allowed, Actor actor) {
        return allowed.contains(actor) ? status().is2xxSuccessful() : status().isForbidden();
    }

    private static Map<String, Object> employeeRequest(String role, Long departmentId) {
        Map<String, Object> request = new HashMap<>();
        request.put("firstName", "Marie");
        request.put("lastName", "Nová");
        request.put("role", role);
        request.put("departmentId", departmentId);
        return request;
    }
}
