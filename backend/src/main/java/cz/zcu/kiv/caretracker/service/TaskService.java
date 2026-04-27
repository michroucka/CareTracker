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

/**
 * Manages billable service catalog entries scoped to an organization.
 */
@Service
public class TaskService extends BaseRoleFilteringService<Task, TaskDTO> {
    @Autowired
    TaskRepository taskRepository;
    @Autowired
    TaskMapper taskMapper;
    @Autowired
    OrganizationRepository organizationRepository;

    /**
     * Returns tasks filtered by the current user's role and optional status filter.
     *
     * @param organizationId optional organization filter (SUPERADMIN only)
     * @param status {@code true} = active, {@code false} = inactive, {@code null} = all
     * @return role-filtered list of task DTOs
     */
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

    /**
     * Returns a single task by ID with organization-level access control.
     *
     * @param id the task ID
     * @return the task DTO, or empty if not found or inaccessible
     */
    @Transactional(readOnly = true)
    public Optional<TaskDTO> getTaskById(Long id) {
        return getEntityByIdWithPermissionCheck(
                id,
                () -> taskRepository.findById(id),
                task -> task.getOrganization().getId(),
                taskMapper::toDTO
        );
    }

    /**
     * Persists a task from the supplied DTO, resolving the owning organization.
     * SUPERADMIN must supply an explicit organizationId; other roles use their own organization.
     */
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

    /**
     * Creates a new task.
     *
     * @param dto the task creation data
     * @return the persisted task entity
     */
    public Task createTask(TaskRequestDTO dto) {
        Task task = new Task();
        return saveTask(task, dto);
    }

    /**
     * Updates an existing task.
     *
     * @param id the task ID
     * @param dto updated task data
     * @return the updated task entity
     */
    public Task updateTask(Long id, TaskRequestDTO dto) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Úkon nebyl nalezen"));

        validateOrganizationAccess(task, t -> t.getOrganization().getId());

        return saveTask(task, dto);
    }

    /** Sets the active flag on a task with organization-level access validation. */
    private Task setTaskStatus(Long id, boolean status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Úkon nebyl nalezen"));

        validateOrganizationAccess(task, t -> t.getOrganization().getId());

        task.setActive(status);

        return taskRepository.save(task);
    }

    /**
     * Deactivates a task (soft delete).
     *
     * @param id the task ID
     * @return the updated task entity
     */
    public Task terminateTask(Long id) {
        return setTaskStatus(id, false);
    }

    /**
     * Re-activates a previously deactivated task.
     *
     * @param id the task ID
     * @return the updated task entity
     */
    public Task activateTask(Long id) {
        return setTaskStatus(id, true);
    }
}
