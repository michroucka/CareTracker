package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
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
@RequestMapping("/api/departments")
public class DepartmentController {
    private static final Logger log = LoggerFactory.getLogger(DepartmentController.class);

    @Autowired
    private DepartmentRepository departmentRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<List<Department>> getAllDepartments(@AuthenticationPrincipal MyUserDetails userDetails) {
        List<Department> departments;

        // SUPERADMIN vidí všechna oddělení ze všech organizací
        if (userDetails.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_SUPERADMIN"))) {
            log.info("Fetching all departments for SUPERADMIN");
            departments = departmentRepository.findAll();
        } else {
            Long organizationId = userDetails.getOrganizationId();

            if (organizationId == null) {
                log.warn("User {} has no organization", userDetails.getUsername());
                return ResponseEntity.badRequest().build();
            }

            log.info("Fetching departments for organization {}", organizationId);
            departments = departmentRepository.findByOrganizationId(organizationId);
        }

        return ResponseEntity.ok(departments);
    }
}
