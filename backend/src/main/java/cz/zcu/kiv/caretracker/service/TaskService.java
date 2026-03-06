package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.task.TaskDTO;
import cz.zcu.kiv.caretracker.dto.task.TaskRequestDTO;
import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.mapper.TaskMapper;
import cz.zcu.kiv.caretracker.repository.OrganizationRepository;
import cz.zcu.kiv.caretracker.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService extends BaseRoleFilteringService<Task, TaskDTO> {
    @Autowired
    TaskRepository taskRepository;
    @Autowired
    TaskMapper taskMapper;
    @Autowired
    OrganizationRepository organizationRepository;

    @Transactional(readOnly = true)
    public List<TaskDTO> getTasks(Long organizationId, Boolean status) {
        // Calculate filters based on user role
        RoleBasedFilters roleFilters = calculateRoleBasedFilters(organizationId, null);

        // If user has no access, return empty list
        if (roleFilters.isNoAccess()) {
            return List.of();
        }

        // Fetch tasks based on computed organizationId
        // status: null = all, true = active only, false = inactive only
        Long orgId = roleFilters.getOrganizationId();
        List<Task> tasks;
        if (status == null) {
            tasks = taskRepository.findByOrganizationId(orgId);
        } else if (status) {
            tasks = taskRepository.findByActiveTrueAndOrganizationId(orgId);
        } else {
            tasks = taskRepository.findByActiveFalseAndOrganizationId(orgId);
        }

        return taskMapper.toDTOList(tasks);
    }

    @Transactional(readOnly = true)
    public Optional<TaskDTO> getTaskById(Long id) {
        return getEntityByIdWithPermissionCheck(
                id,
                () -> taskRepository.findById(id),
                task -> task.getOrganization().getId(),
                taskMapper::toDTO
        );
    }

    private Task saveTask(Task task, TaskRequestDTO dto) {
        User user = getCurrentUser();

        Organization organization;
        if (user.getRole() == cz.zcu.kiv.caretracker.enums.UserRole.SUPERADMIN) {
            if (task.getOrganization() != null) {
                organization = task.getOrganization();
            } else if (dto.getOrganizationId() != null) {
                organization = organizationRepository.findById(dto.getOrganizationId())
                        .orElseThrow(() -> new ResourceNotFoundException("Organizace nebyla nalezena"));
            } else {
                throw new cz.zcu.kiv.caretracker.exception.ValidationException("Pro vytvoření úkonu musí SUPERADMIN zvolit organizaci");
            }
        } else {
            Employee employee = user.getEmployee();
            if (employee == null) {
                throw new SecurityException("Pouze zaměstnanci mohou vytvářet nebo upravovat úkony");
            }
            organization = employee.getOrganization();
        }

        taskMapper.requestToTask(task, dto, organization);

        return taskRepository.save(task);
    }

    public Task createTask(TaskRequestDTO dto) {
        Task task = new Task();
        return saveTask(task, dto);
    }

    public Task updateTask(Long id, TaskRequestDTO dto) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Úkon nebyl nalezen"));

        validateOrganizationAccess(task, t -> t.getOrganization().getId());

        return saveTask(task, dto);
    }

    private Task setTaskStatus(Long id, boolean status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Úkon nebyl nalezen"));

        validateOrganizationAccess(task, t -> t.getOrganization().getId());

        task.setActive(status);

        return taskRepository.save(task);
    }

    public Task terminateTask(Long id) {
        return setTaskStatus(id, false);
    }

    public Task activateTask(Long id) {
        return setTaskStatus(id, true);
    }
}
