package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.dashboard.DashboardDTO;
import cz.zcu.kiv.caretracker.dto.dashboard.DashboardView;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.mapper.DashboardMapper;
import cz.zcu.kiv.caretracker.mapper.PerformedTaskMapper;
import cz.zcu.kiv.caretracker.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Which dashboard views a user may switch to and which one they start on, for combinations of the account role
 * (what the user may see) and the employee's job (what they usually do). Runs without a database because some
 * combinations, such as an employee without a department, cannot be stored in the current schema
 * (served views and fallbacks of the standard roles are in {@code DashboardAccessIT}).
 */
@ExtendWith(MockitoExtension.class)
class DashboardViewsTest {

    private static final String USERNAME = "jana@caretracker.test";

    @Mock private PerformedTaskRepository performedTaskRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private UserRepository userRepository;
    @Mock private IndividualPlanRepository individualPlanRepository;
    @Mock private PerformedTaskMapper performedTaskMapper;
    @Mock private DashboardMapper dashboardMapper;

    @InjectMocks
    private DashboardService dashboardService;

    @BeforeEach
    void logIn() {
        ReflectionTestUtils.setField(dashboardService, "clock",
                Clock.fixed(Instant.parse("2027-01-15T09:00:00Z"), ZoneId.of("Europe/Prague")));
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(USERNAME, null, List.of()));
    }

    @AfterEach
    void logOut() {
        SecurityContextHolder.clearContext();
    }

    @ParameterizedTest(name = "{0} working as {1}, department: {2} -> {3}, starts on {4}")
    @CsvSource({
            "ADMIN,       COORDINATOR, true,  ORGANIZATION DEPARTMENT MINE, DEPARTMENT",
            "ADMIN,       CAREGIVER,   true,  ORGANIZATION DEPARTMENT MINE, MINE",
            "ADMIN,       MANAGER,     false, ORGANIZATION MINE,            ORGANIZATION",
            "ADMIN,       COORDINATOR, false, ORGANIZATION MINE,            ORGANIZATION",
            "COORDINATOR, CAREGIVER,   true,  DEPARTMENT MINE,              MINE",
            "COORDINATOR, MANAGER,     true,  DEPARTMENT MINE,              DEPARTMENT",
            "COORDINATOR, COORDINATOR, false, MINE,                         MINE",
            "CAREGIVER,   COORDINATOR, true,  MINE,                         MINE",
            "CAREGIVER,   MANAGER,     true,  MINE,                         MINE"
    })
    void viewsFollowAccountRoleAndDefaultFollowsJob(UserRole role, EmployeeRole job, boolean hasDepartment,
                                                    String availableViews, DashboardView defaultView) {
        loggedIn(staff(role, job, hasDepartment));

        DashboardDTO dashboard = dashboardService.getDashboard(null);

        assertThat(dashboard.getAvailableViews()).containsExactlyElementsOf(views(availableViews));
        assertThat(dashboard.getView()).isEqualTo(defaultView);
    }

    @Test
    void coordinatorWithoutDepartmentAskingForDepartmentGetsOwnWork() {
        loggedIn(staff(UserRole.COORDINATOR, EmployeeRole.COORDINATOR, false));

        DashboardDTO dashboard = dashboardService.getDashboard(DashboardView.DEPARTMENT);

        assertThat(dashboard.getView()).isEqualTo(DashboardView.MINE);
    }

    @Test
    void adminWithoutDepartmentAskingForDepartmentGetsDefaultView() {
        loggedIn(staff(UserRole.ADMIN, EmployeeRole.CAREGIVER, false));

        DashboardDTO dashboard = dashboardService.getDashboard(DashboardView.DEPARTMENT);

        assertThat(dashboard.getView()).isEqualTo(DashboardView.MINE);
    }

    @Test
    void clientAccountGetsEmptyDashboard() {
        User clientAccount = new User();
        clientAccount.setRole(UserRole.CLIENT);
        clientAccount.setClient(new Client());
        loggedIn(clientAccount);

        assertThat(dashboardService.getDashboard(DashboardView.MINE)).isEqualTo(new DashboardDTO());
    }

    @Test
    void staffAccountWithoutEmployeeGetsEmptyDashboard() {
        User admin = new User();
        admin.setRole(UserRole.ADMIN);
        loggedIn(admin);

        assertThat(dashboardService.getDashboard(DashboardView.ORGANIZATION)).isEqualTo(new DashboardDTO());
    }

    private void loggedIn(User user) {
        user.setUsername(USERNAME);
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
    }

    private static User staff(UserRole role, EmployeeRole job, boolean hasDepartment) {
        Organization organization = new Organization();
        organization.setId(1L);

        Employee employee = new Employee();
        employee.setId(10L);
        employee.setRole(job);
        employee.setOrganization(organization);
        if (hasDepartment) {
            Department department = new Department();
            department.setId(2L);
            department.setOrganization(organization);
            employee.setDepartment(department);
        }

        User user = new User();
        user.setRole(role);
        user.setEmployee(employee);
        return user;
    }

    private static List<DashboardView> views(String names) {
        return Arrays.stream(names.split(" ")).map(DashboardView::valueOf).toList();
    }
}
