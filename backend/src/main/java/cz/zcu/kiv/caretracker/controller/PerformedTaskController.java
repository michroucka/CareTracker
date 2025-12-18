package cz.zcu.kiv.caretracker.controller;


import cz.zcu.kiv.caretracker.dto.performedTask.PerformedTaskDTO;
import cz.zcu.kiv.caretracker.dto.performedTask.PerformedTaskRequestDTO;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.mapper.PerformedTaskMapper;
import cz.zcu.kiv.caretracker.service.PerformedTaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/performed-tasks")
public class PerformedTaskController {
    private static final Logger log = LoggerFactory.getLogger(PerformedTaskController.class);

    @Autowired
    private PerformedTaskService performedTaskService;

    @Autowired
    private PerformedTaskMapper performedTaskMapper;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<List<PerformedTaskDTO>> getAllPerformedTasks() {
        log.info("Fetching all performed tasks");
        List<PerformedTaskDTO> performedTasks = performedTaskService.getAllPerformedTasks();

        return ResponseEntity.ok(performedTasks);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<PerformedTaskDTO> getPerformedTaskById(@PathVariable Long id) {
        log.info("Fetching performed task with id: {}", id);
        return performedTaskService.getPerformedTaskById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<PerformedTaskDTO> createPerformedTask(@RequestBody PerformedTaskRequestDTO dto) {
        log.info("Creating new performed task");
        PerformedTask savedPerformedTask = performedTaskService.createPerformedTask(dto);
        return ResponseEntity.ok(performedTaskMapper.toDTO(savedPerformedTask));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<PerformedTaskDTO> updatePerformedTask(
            @PathVariable Long id, @RequestBody PerformedTaskRequestDTO dto
    ) {
        log.info("Updating performed task with id: {}", id);
        PerformedTask updated = performedTaskService.updatePerformedTask(id, dto);
        return ResponseEntity.ok(performedTaskMapper.toDTO(updated));
    }
}
