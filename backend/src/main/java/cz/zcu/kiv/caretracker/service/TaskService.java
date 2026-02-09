package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.task.TaskDTO;
import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.mapper.TaskMapper;
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


    @Transactional(readOnly = true)
    protected List<TaskDTO> getTasksByRole(boolean activeOnly) {
        return filterEntitiesByRole(
                () -> activeOnly ? taskRepository.findByActiveTrue() : taskRepository.findAll(),
                orgId -> activeOnly ? taskRepository.findByActiveTrueAndOrganizationId(orgId)
                        : taskRepository.findByOrganizationId(orgId),
                taskMapper::toDTOList
        );
    }

    @Transactional(readOnly = true)
    public List<TaskDTO> getAllActiveTasks() {
        return getTasksByRole(true);
    }

    @Transactional(readOnly = true)
    public List<TaskDTO> getAllTasks(Long organizationId, Boolean status) {
        // Calculate filters based on user role
        RoleBasedFilters roleFilters = calculateRoleBasedFilters(organizationId, null);

        // If user has no access, return empty list
        if (roleFilters.isNoAccess()) {
            return List.of();
        }

        // Determine activeOnly based on status parameter
        // null = all, true = active only, false = inactive only
        // For simplicity, we'll support null (all) and true (active)
        boolean activeOnly = status != null && status;

        // Fetch tasks based on computed organizationId
        List<Task> tasks;
        if (roleFilters.getOrganizationId() != null) {
            tasks = activeOnly
                ? taskRepository.findByActiveTrueAndOrganizationId(roleFilters.getOrganizationId())
                : taskRepository.findByOrganizationId(roleFilters.getOrganizationId());
        } else {
            // SUPERADMIN without organizationId filter - return all
            tasks = activeOnly ? taskRepository.findByActiveTrue() : taskRepository.findAll();
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

    private Task saveTask(Task task, TaskDTO dto) {
        User user = getCurrentUser();
        Employee employee = user.getEmployee();

        if (employee == null) {
            throw new SecurityException("Pouze zaměstnanci mohou vytvářet nebo upravovat úkoly");
        }

        Organization organization = employee.getOrganization();

        taskMapper.toTask(task, dto, organization);

        return taskRepository.save(task);
    }

    public Task createTask(TaskDTO dto) {
        Task task = new Task();
        return saveTask(task, dto);
    }

    public Task updateTask(Long id, TaskDTO dto) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Úkol nebyl nalezen"));

        // Validace oprávnění
        validateOrganizationAccess(task, t -> t.getOrganization().getId());

        return saveTask(task, dto);
    }

    public Task terminateTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Úkol nebyl nalezen"));

        // Validace oprávnění
        validateOrganizationAccess(task, t -> t.getOrganization().getId());

        task.setActive(false);

        return taskRepository.save(task);
    }
}
