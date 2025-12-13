package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.repository.TaskRepository;
import cz.zcu.kiv.caretracker.security.MyUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private static final Logger log = LoggerFactory.getLogger(TaskController.class);

    @Autowired
    private TaskRepository taskRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<List<Task>> getAllTasks(@AuthenticationPrincipal MyUserDetails userDetails) {
        List<Task> tasks;

        // SUPERADMIN vidí všechny tasky ze všech organizací
        if (userDetails.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_SUPERADMIN"))) {
            log.info("Fetching all tasks for SUPERADMIN");
            tasks = taskRepository.findAll();
        } else {
            Long organizationId = userDetails.getOrganizationId();

            if (organizationId == null) {
                log.warn("User {} has no organization", userDetails.getUsername());
                return ResponseEntity.badRequest().build();
            }

            log.info("Fetching tasks for organization {}", organizationId);
            tasks = taskRepository.findByOrganizationId(organizationId);
        }

        return ResponseEntity.ok(tasks);
    }
}
