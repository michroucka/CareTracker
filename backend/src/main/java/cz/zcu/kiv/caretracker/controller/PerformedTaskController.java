package cz.zcu.kiv.caretracker.controller;


import cz.zcu.kiv.caretracker.dto.PerformedTaskDTO;
import cz.zcu.kiv.caretracker.mapper.PerformedTaskMapper;
import cz.zcu.kiv.caretracker.service.PerformedTaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
