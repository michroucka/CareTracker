package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.performedTask.PerformedTaskSummaryDTO;
import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.mapper.PerformedTaskMapper;
import cz.zcu.kiv.caretracker.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PerformedTaskServiceTest {

    @Mock
    private PerformedTaskRepository performedTaskRepository;
    @Mock
    private PerformedTaskMapper performedTaskMapper;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PerformedTaskService performedTaskService;

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

    @Test
    void getPerformedTasks_clientRoleWithClient_queriesOnlyOwnTasks() {
        Client client = new Client();
        client.setId(5L);

        User clientUser = new User();
        clientUser.setRole(UserRole.CLIENT);
        clientUser.setClient(client);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(clientUser));
        when(performedTaskRepository.findAll(any(Specification.class))).thenReturn(Collections.emptyList());
        when(performedTaskMapper.toSummaryDTOList(anyList())).thenReturn(Collections.emptyList());

        List<PerformedTaskSummaryDTO> result = performedTaskService.getPerformedTasks(null, null, null, null, null, null);

        assertNotNull(result);
        verify(performedTaskRepository).findAll(any(Specification.class));
    }

    @Test
    void getPerformedTasks_clientRoleWithoutClient_returnsEmptyList() {
        User clientUser = new User();
        clientUser.setRole(UserRole.CLIENT);
        clientUser.setClient(null);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(clientUser));

        List<PerformedTaskSummaryDTO> result = performedTaskService.getPerformedTasks(null, null, null, null, null, null);

        assertTrue(result.isEmpty());
        verifyNoInteractions(performedTaskRepository);
    }

    @Test
    void getPerformedTasks_adminRole_usesRoleBasedFilters() {
        Organization org = new Organization();
        org.setId(1L);

        Employee employee = new Employee();
        employee.setOrganization(org);

        User adminUser = new User();
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setEmployee(employee);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(adminUser));
        when(performedTaskRepository.findAll(any(Specification.class))).thenReturn(Collections.emptyList());
        when(performedTaskMapper.toSummaryDTOList(anyList())).thenReturn(Collections.emptyList());

        List<PerformedTaskSummaryDTO> result = performedTaskService.getPerformedTasks(null, null, null, null, null, null);

        assertNotNull(result);
        verify(performedTaskRepository).findAll(any(Specification.class));
    }

    @Test
    void deletePerformedTask_caregiverNotAssigned_throwsSecurityException() {
        Organization org = new Organization();
        org.setId(1L);

        Department dept = new Department();
        dept.setId(1L);

        Employee employee = new Employee();
        employee.setId(99L);
        employee.setOrganization(org);
        employee.setDepartment(dept);

        User caregiverUser = new User();
        caregiverUser.setRole(UserRole.CAREGIVER);
        caregiverUser.setEmployee(employee);

        Organization taskOrg = new Organization();
        taskOrg.setId(1L);

        Department taskDept = new Department();
        taskDept.setId(1L);

        PerformedTask task = new PerformedTask();
        task.setOrganization(taskOrg);
        task.setDepartment(taskDept);
        task.setCaregivers(Collections.emptyList());

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(caregiverUser));
        when(performedTaskRepository.findById(1L)).thenReturn(Optional.of(task));

        assertThrows(SecurityException.class, () -> performedTaskService.deletePerformedTask(1L));
    }

    @Test
    void deletePerformedTask_taskNotFound_throwsResourceNotFoundException() {
        when(performedTaskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> performedTaskService.deletePerformedTask(999L));
    }
}
