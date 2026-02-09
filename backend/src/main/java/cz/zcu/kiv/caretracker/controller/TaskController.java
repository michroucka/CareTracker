package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.task.TaskDTO;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.mapper.TaskMapper;
import cz.zcu.kiv.caretracker.service.TaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private static final Logger log = LoggerFactory.getLogger(TaskController.class);

    @Autowired
    private TaskService taskService;
    @Autowired
    private TaskMapper taskMapper;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<List<TaskDTO>> getAllTasks(
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) Boolean status
    ) {
        log.info("Fetching all tasks" + (organizationId != null ? " for organization: " + organizationId : ""));
        List<TaskDTO> tasks = taskService.getAllTasks(organizationId, status);

        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<List<TaskDTO>> getAllActiveTasks() {
        log.info("Fetching all active tasks");
        List<TaskDTO> tasks = taskService.getAllActiveTasks();

        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable Long id) {
        log.info("Fetching task with id: {}", id);
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<TaskDTO> createTask(@RequestBody TaskDTO dto) {
        log.info("Creating new task");
        Task savedTask = taskService.createTask(dto);
        return ResponseEntity.ok(taskMapper.toDTO(savedTask));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<TaskDTO> updateTask(
            @PathVariable Long id, @RequestBody TaskDTO dto
    ) {
        log.info("Updating task with id: {}", id);
        Task updated = taskService.updateTask(id, dto);
        return ResponseEntity.ok(taskMapper.toDTO(updated));
    }

    @PutMapping("/{id}/terminate")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public Task terminateTask(@PathVariable Long id) {
        log.info("Terminating task with id: {}", id);
        return taskService.terminateTask(id);
    }
}
