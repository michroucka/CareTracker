package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.client.ClientShortDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientTerminateDTO;
import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.mapper.ClientMapper;
import cz.zcu.kiv.caretracker.mapper.IndividualPlanContentMapper;
import cz.zcu.kiv.caretracker.mapper.IndividualPlanMapper;
import cz.zcu.kiv.caretracker.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClientServiceTest {

    @Mock
    private ClientRepository clientRepository;
    @Mock
    private ClientMapper clientMapper;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private IndividualPlanRepository individualPlanRepository;
    @Mock
    private IndividualPlanMapper individualPlanMapper;
    @Mock
    private IndividualPlanContentMapper individualPlanContentMapper;
    @Mock
    private DailyRecordRepository dailyRecordRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ClientService clientService;

    @BeforeEach
    void setupSecurityContext() {
        Authentication auth = mock(Authentication.class);
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("testuser");
        SecurityContextHolder.setContext(ctx);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private User buildAdminUser(Long orgId) {
        Organization org = new Organization();
        org.setId(orgId);

        Employee employee = new Employee();
        employee.setOrganization(org);

        User adminUser = new User();
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setEmployee(employee);
        return adminUser;
    }

    private Client buildClient(Long orgId, Long deptId) {
        Organization org = new Organization();
        org.setId(orgId);

        Department dept = new Department();
        dept.setId(deptId);

        Client client = new Client();
        client.setId(1L);
        client.setOrganization(org);
        client.setDepartment(dept);
        return client;
    }

    @Test
    void terminateClient_setsActiveToFalseWithTerminationData() {
        Client client = buildClient(1L, 1L);
        client.setActive(true);

        LocalDate terminationDate = LocalDate.of(2026, 1, 15);
        ClientTerminateDTO dto = new ClientTerminateDTO(terminationDate, "EXITUS");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(buildAdminUser(1L)));
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(clientRepository.save(any(Client.class))).thenReturn(client);

        Client result = clientService.terminateClient(1L, dto);

        assertFalse(result.getActive());
        assertEquals(terminationDate, result.getTerminationDate());
        assertNotNull(result.getTerminationReason());
        verify(clientRepository).save(client);
    }

    @Test
    void activateClient_setsActiveToTrueAndClearsTerminationData() {
        Client client = buildClient(1L, 1L);
        client.setActive(false);
        client.setTerminationDate(LocalDate.of(2025, 6, 1));

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(buildAdminUser(1L)));
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(clientRepository.save(any(Client.class))).thenReturn(client);

        Client result = clientService.activateClient(1L);

        assertTrue(result.getActive());
        assertNull(result.getTerminationDate());
        assertNull(result.getTerminationReason());
        verify(clientRepository).save(client);
    }

    @Test
    void getClients_coordinatorRequestsOtherDepartment_returnsEmptyList() {
        Organization org = new Organization();
        org.setId(1L);

        Department dept = new Department();
        dept.setId(1L);

        Employee employee = new Employee();
        employee.setOrganization(org);
        employee.setDepartment(dept);

        User coordinatorUser = new User();
        coordinatorUser.setRole(UserRole.COORDINATOR);
        coordinatorUser.setEmployee(employee);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(coordinatorUser));

        // Request department 2L but coordinator is in department 1L → noAccess
        List<ClientShortDTO> result = clientService.getClients(null, null, List.of(2L), null);

        assertTrue(result.isEmpty());
        verifyNoInteractions(clientRepository);
    }
}
