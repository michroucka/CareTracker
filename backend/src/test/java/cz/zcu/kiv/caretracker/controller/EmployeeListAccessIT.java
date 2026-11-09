package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.AccessScenario;
import cz.zcu.kiv.caretracker.support.AccessScenario.Actor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;
import java.util.stream.Stream;

import static cz.zcu.kiv.caretracker.support.AccessScenario.Actor.*;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** GET /api/employees returns only employees the user may see, whatever filters the request sends. */
class EmployeeListAccessIT extends AbstractIntegrationTest {

    enum Scope { DEPARTMENT, OTHER_DEPARTMENT, OTHER_ORGANIZATION }

    @Autowired
    private EmployeeRepository employeeRepository;

    private AccessScenario scenario;

    @BeforeEach
    void createScenario() {
        scenario = new AccessScenario(testData);
    }

    static Stream<Arguments> visibleDepartmentsByActor() {
        return Stream.of(
                Arguments.of(SUPERADMIN, List.of(Scope.DEPARTMENT, Scope.OTHER_DEPARTMENT, Scope.OTHER_ORGANIZATION)),
                Arguments.of(ADMIN, List.of(Scope.DEPARTMENT, Scope.OTHER_DEPARTMENT)),
                Arguments.of(ADMIN_OTHER_ORG, List.of(Scope.OTHER_ORGANIZATION)),
                Arguments.of(COORDINATOR, List.of(Scope.DEPARTMENT)),
                Arguments.of(COORDINATOR_OTHER_DEPT, List.of(Scope.OTHER_DEPARTMENT)),
                Arguments.of(COORDINATOR_OTHER_ORG, List.of(Scope.OTHER_ORGANIZATION)),
                Arguments.of(CAREGIVER, List.of(Scope.DEPARTMENT)),
                Arguments.of(CAREGIVER_OTHER_DEPT, List.of(Scope.OTHER_DEPARTMENT)),
                Arguments.of(CAREGIVER_OTHER_ORG, List.of(Scope.OTHER_ORGANIZATION))
        );
    }

    @ParameterizedTest
    @MethodSource("visibleDepartmentsByActor")
    void listShowsOnlyEmployeesInScope(Actor actor, List<Scope> expected) throws Exception {
        perform(actor, get("/api/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(employeeIdsIn(expected))));
    }

    @Test
    void clientAccountCannotListEmployees() throws Exception {
        perform(CLIENT_ACCOUNT, get("/api/employees"))
                .andExpect(status().isForbidden());
    }

    @Test
    void superadminCanNarrowListToOrganization() throws Exception {
        perform(SUPERADMIN, get("/api/employees").param("organizationId", scenario.organization.getId().toString()))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(employeeIdsIn(List.of(Scope.DEPARTMENT, Scope.OTHER_DEPARTMENT)))));
    }

    @Test
    void adminCannotListOtherOrganizationByParameter() throws Exception {
        perform(ADMIN, get("/api/employees").param("organizationId", scenario.otherOrganization.getId().toString()))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(employeeIdsIn(List.of(Scope.DEPARTMENT, Scope.OTHER_DEPARTMENT)))));
    }

    @Test
    void adminCannotListOtherOrganizationDepartmentByParameter() throws Exception {
        perform(ADMIN, get("/api/employees").param("departmentIds", scenario.otherOrganizationDepartment.getId().toString()))
                .andExpect(jsonPath("$", empty()));
    }

    @Test
    void coordinatorCannotListOtherDepartmentByParameter() throws Exception {
        perform(COORDINATOR, get("/api/employees").param("departmentIds", scenario.otherDepartment.getId().toString()))
                .andExpect(jsonPath("$", empty()));
    }

    @Test
    void coordinatorSeesTerminatedEmployeesOfDepartment() throws Exception {
        Employee terminated = terminatedEmployee();

        perform(COORDINATOR, get("/api/employees").param("status", "false"))
                .andExpect(jsonPath("$[*].id", containsInAnyOrder(terminated.getId().intValue())));
    }

    @Test
    void caregiverCannotListTerminatedEmployees() throws Exception {
        Employee terminated = terminatedEmployee();

        perform(CAREGIVER, get("/api/employees").param("status", "false"))
                .andExpect(jsonPath("$[*].id", not(hasItem(terminated.getId().intValue()))));
    }

    private Employee terminatedEmployee() {
        Employee employee = testData.employee(scenario.department, EmployeeRole.CAREGIVER);
        employee.setActive(false);
        return employeeRepository.save(employee);
    }

    private ResultActions perform(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(scenario.user(actor))));
    }

    // JSON numbers are read back as Integer, so ids are compared as Integer
    private Object[] employeeIdsIn(List<Scope> scopes) {
        List<Long> departmentIds = scopes.stream().map(this::departmentOf).map(Department::getId).toList();
        return employeeRepository.findAll().stream()
                .filter(employee -> departmentIds.contains(employee.getDepartment().getId()))
                .map(employee -> employee.getId().intValue())
                .toArray();
    }

    private Department departmentOf(Scope scope) {
        return switch (scope) {
            case DEPARTMENT -> scenario.department;
            case OTHER_DEPARTMENT -> scenario.otherDepartment;
            case OTHER_ORGANIZATION -> scenario.otherOrganizationDepartment;
        };
    }
}
