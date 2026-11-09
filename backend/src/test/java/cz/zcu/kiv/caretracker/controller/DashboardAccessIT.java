package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.dashboard.DashboardView;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.AccessScenario;
import cz.zcu.kiv.caretracker.support.AccessScenario.Actor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.EnumSet;
import java.util.Set;

import static cz.zcu.kiv.caretracker.support.AccessScenario.Actor.*;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Who may read the dashboard and which views ({@code ?view=}) each role gets. A view the role may not see
 * falls back to the default one, which follows the employee's job (manager, coordinator, caregiver).
 */
class DashboardAccessIT extends AbstractIntegrationTest {

    private static final Set<Actor> STAFF = EnumSet.complementOf(EnumSet.of(CLIENT_ACCOUNT));

    private AccessScenario scenario;

    @BeforeEach
    void createScenario() {
        scenario = new AccessScenario(testData);
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void readDashboard(Actor actor) throws Exception {
        perform(actor, get("/api/dashboard"))
                .andExpect(STAFF.contains(actor) ? status().isOk() : status().isForbidden());
    }

    @Test
    void adminStartsOnOrganizationAndMaySwitchToEveryView() throws Exception {
        perform(ADMIN, get("/api/dashboard"))
                .andExpect(jsonPath("$.view").value("ORGANIZATION"))
                .andExpect(jsonPath("$.availableViews", contains("ORGANIZATION", "DEPARTMENT", "MINE")));
    }

    @Test
    void coordinatorStartsOnDepartmentAndMaySwitchToOwnWork() throws Exception {
        perform(COORDINATOR, get("/api/dashboard"))
                .andExpect(jsonPath("$.view").value("DEPARTMENT"))
                .andExpect(jsonPath("$.availableViews", contains("DEPARTMENT", "MINE")));
    }

    @Test
    void caregiverSeesOnlyOwnWork() throws Exception {
        perform(CAREGIVER, get("/api/dashboard"))
                .andExpect(jsonPath("$.view").value("MINE"))
                .andExpect(jsonPath("$.availableViews", contains("MINE")));
    }

    @ParameterizedTest
    @CsvSource({
            "ADMIN, ORGANIZATION, ORGANIZATION",
            "ADMIN, DEPARTMENT, DEPARTMENT",
            "ADMIN, MINE, MINE",
            "COORDINATOR, ORGANIZATION, DEPARTMENT",
            "COORDINATOR, MINE, MINE",
            "CAREGIVER, ORGANIZATION, MINE",
            "CAREGIVER, DEPARTMENT, MINE",
            "ADMIN, UNKNOWN, ORGANIZATION",
            "COORDINATOR, UNKNOWN, DEPARTMENT"
    })
    void requestedViewIsServedOnlyWhenRoleAllowsIt(Actor actor, String requestedView, String servedView) throws Exception {
        perform(actor, get("/api/dashboard").param("view", requestedView))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.view").value(servedView));
    }

    @Test
    void caregiverAskingForOrganizationGetsNoOrganizationFigures() throws Exception {
        perform(CAREGIVER, get("/api/dashboard").param("view", "ORGANIZATION"))
                .andExpect(jsonPath("$.employeeCount").doesNotExist())
                .andExpect(jsonPath("$.departmentCount").doesNotExist())
                .andExpect(jsonPath("$.totalMonthlyIncome").doesNotExist())
                .andExpect(jsonPath("$.tasksPerformedByDepartment").doesNotExist());
    }

    @ParameterizedTest
    @EnumSource(DashboardView.class)
    void superadminAlwaysGetsPlatformOverviewWithoutStaffViews(DashboardView requestedView) throws Exception {
        perform(SUPERADMIN, get("/api/dashboard").param("view", requestedView.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.platform").exists())
                .andExpect(jsonPath("$.view").doesNotExist())
                .andExpect(jsonPath("$.recentPerformedTasks").doesNotExist());
    }

    private ResultActions perform(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(scenario.user(actor))));
    }
}
