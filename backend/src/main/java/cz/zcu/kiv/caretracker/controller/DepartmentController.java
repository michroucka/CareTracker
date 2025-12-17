package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.DepartmentDTO;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
import cz.zcu.kiv.caretracker.security.MyUserDetails;
import cz.zcu.kiv.caretracker.service.DepartmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    private static final Logger log = LoggerFactory.getLogger(DepartmentController.class);

    @Autowired
    private DepartmentService departmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() {
        log.info("Fetching all departments");
        List<DepartmentDTO> departments = departmentService.getAllDepartments();

        return ResponseEntity.ok(departments);
    }
}
