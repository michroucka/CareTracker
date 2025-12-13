package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.performedTask.PerformedTaskDTO;
import cz.zcu.kiv.caretracker.dto.performedTask.PerformedTaskRequestDTO;
import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.mapper.PerformedTaskMapper;
import cz.zcu.kiv.caretracker.repository.*;
import org.springframework.security.core.parameters.P;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PerformedTaskService {

    @Autowired
    private PerformedTaskRepository performedTaskRepository;
    @Autowired
    private PerformedTaskMapper performedTaskMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<PerformedTaskDTO> getAllPerformedTasks() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new SecurityException("User is not authenticated");
        }

        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<PerformedTask> performedTasks;
        UserRole role = user.getRole();

        // SUPERADMIN má přístup ke všemu
        if (role == UserRole.SUPERADMIN) {
            performedTasks = performedTaskRepository.findAll();
        }
        // Zaměstnanci - filtrování podle organizace/oddělení
        else if (user.getEmployee() != null) {
            // ADMIN vidí klienty celé organizace
            if (role == UserRole.ADMIN) {
                if (user.getEmployee().getOrganization() == null) {
                    throw new SecurityException("Admin must have an associated organization");
                }
                Long organizationId = user.getEmployee().getOrganization().getId();
                performedTasks = performedTaskRepository.findByOrganizationId(organizationId);
            }
            // COORDINATOR a CAREGIVER vidí pouze klienty ze svého oddělení
            else if (role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getDepartment() == null) {
                    throw new SecurityException("Employee must have an associated department");
                }
                Long departmentId = user.getEmployee().getDepartment().getId();
                performedTasks = performedTaskRepository.findByDepartmentId(departmentId);
            }
            else {
                throw new SecurityException("Unauthorized employee role");
            }
        }

        else {
            throw new SecurityException("User does not have permission to view clients");
        }

        return performedTaskMapper.toDTOList(performedTasks);
    }

    private PerformedTask savePerformedTask(PerformedTask performedTask, PerformedTaskRequestDTO dto) {
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));
        Task task = taskRepository.findById(dto.getTaskId())
                .orElseThrow(() -> new RuntimeException("Task not found"));
        List<Employee> caregivers = new ArrayList<>();
        for (Long employeeId : dto.getCaregiverIds()) {
            Employee caregiver = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));

            caregivers.add(caregiver);
        }

        performedTaskMapper.requestToPerformedTask(performedTask, dto, client, task, caregivers);

        return performedTaskRepository.save(performedTask);
    }

    public PerformedTask createPerformedTask(PerformedTaskRequestDTO dto) {
        PerformedTask performedTask = new PerformedTask();
        return savePerformedTask(performedTask, dto);
    }
}
