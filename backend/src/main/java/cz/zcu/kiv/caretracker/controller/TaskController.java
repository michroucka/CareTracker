package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.TaskDTO;
import cz.zcu.kiv.caretracker.repository.TaskRepository;
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
    private TaskRepository taskRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<List<TaskDTO>> getAllTasks() {
        log.info("Fetching all tasks");
        List<TaskDTO> tasks = taskService.getAllTasks();

        return ResponseEntity.ok(tasks);
    }
}
