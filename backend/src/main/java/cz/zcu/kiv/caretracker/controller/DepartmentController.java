package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.department.DepartmentDTO;
import cz.zcu.kiv.caretracker.dto.department.DepartmentRequestDTO;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.mapper.DepartmentMapper;
import cz.zcu.kiv.caretracker.service.DepartmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    private static final Logger log = LoggerFactory.getLogger(DepartmentController.class);

    @Autowired
    private DepartmentService departmentService;
    @Autowired
    private DepartmentMapper departmentMapper;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments(
            @RequestParam(required = false) Long organizationId
    ) {
        log.info("Fetching all departments" + (organizationId != null ? " for organization: " + organizationId : ""));
        List<DepartmentDTO> departments = departmentService.getAllDepartments(organizationId);

        return ResponseEntity.ok(departments);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<DepartmentDTO> getDepartmentById(@PathVariable Long id) {
        log.info("Fetching department with id: {}", id);
        return departmentService.getDepartmentById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<DepartmentDTO> createDepartment(@RequestBody DepartmentRequestDTO dto) {
        log.info("Creating new department: {}", dto.getCity());
        Department savedDepartment = departmentService.createDepartment(dto);
        return ResponseEntity.ok(departmentMapper.toDTO(savedDepartment));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<DepartmentDTO> updateDepartment(@PathVariable Long id, @RequestBody DepartmentRequestDTO dto) {
        log.info("Updating department with id: {}", id);
        Department updatedDepartment = departmentService.updateDepartment(id, dto);
        return ResponseEntity.ok(departmentMapper.toDTO(updatedDepartment));
    }
}
