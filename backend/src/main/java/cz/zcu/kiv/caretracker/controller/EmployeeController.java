package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
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
@RequestMapping("/api/employees")
public class EmployeeController {
    private static final Logger log = LoggerFactory.getLogger(EmployeeController.class);

    @Autowired
    private EmployeeRepository employeeRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<List<Employee>> getAllEmployees(@AuthenticationPrincipal MyUserDetails userDetails) {
        List<Employee> employees;

        // SUPERADMIN vidí všechny zaměstnance ze všech organizací
        if (userDetails.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_SUPERADMIN"))) {
            log.info("Fetching all employees for SUPERADMIN");
            employees = employeeRepository.findAll();
        } else {
            Long organizationId = userDetails.getOrganizationId();

            if (organizationId == null) {
                log.warn("User {} has no organization", userDetails.getUsername());
                return ResponseEntity.badRequest().build();
            }

            log.info("Fetching employees for organization {}", organizationId);
            employees = employeeRepository.findByOrganizationId(organizationId);
        }

        return ResponseEntity.ok(employees);
    }
}
