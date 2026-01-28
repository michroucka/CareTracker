package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.task.TaskDTO;
import cz.zcu.kiv.caretracker.entity.*;
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
    public List<TaskDTO> getAllTasks() {
        return getTasksByRole(false);
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
        Organization organization = user.getEmployee().getOrganization();

        taskMapper.toTask(task, dto, organization);

        return taskRepository.save(task);
    }

    public Task createTask(TaskDTO dto) {
        Task task = new Task();
        return saveTask(task, dto);
    }

    public Task updateTask(Long id, TaskDTO dto) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Validace oprávnění
        validateOrganizationAccess(task, t -> t.getOrganization().getId());

        return saveTask(task, dto);
    }

    public Task terminateTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Validace oprávnění
        validateOrganizationAccess(task, t -> t.getOrganization().getId());

        task.setActive(false);

        return taskRepository.save(task);
    }
}
