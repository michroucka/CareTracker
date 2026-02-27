package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.MessageResponseDTO;
import cz.zcu.kiv.caretracker.dto.employee.EmployeeDTO;
import cz.zcu.kiv.caretracker.dto.employee.EmployeeRequestDTO;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.mapper.EmployeeMapper;
import cz.zcu.kiv.caretracker.service.EmployeeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    private static final Logger log = LoggerFactory.getLogger(EmployeeController.class);
    @Autowired
    private EmployeeService employeeService;
    @Autowired
    private EmployeeMapper employeeMapper;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<List<EmployeeDTO>> getEmployees(
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) Boolean status,
            @RequestParam(required = false) List<Long> departmentIds
            ) {
        log.info("Fetching employees" + (organizationId != null ? " for organization: " + organizationId : ""));
        List<EmployeeDTO> employees = employeeService.getEmployees(organizationId, status, departmentIds);

        return ResponseEntity.ok(employees);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<EmployeeDTO> getEmployeeById(@PathVariable Long id) {
        log.info("Fetching employee with id: {}", id);
        return employeeService.getEmployeeById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR')")
    public ResponseEntity<EmployeeDTO> createEmployee(@RequestBody EmployeeRequestDTO dto) {
        log.info("Creating new employee: {} {}", dto.getFirstName(), dto.getLastName());
        Employee savedEmployee = employeeService.createEmployee(dto);
        return ResponseEntity.ok(employeeMapper.toDTO(savedEmployee));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR')")
    public ResponseEntity<EmployeeDTO> updateEmployee(@PathVariable Long id, @RequestBody EmployeeRequestDTO dto) {
        log.info("Updating employee with id: {}", id);
        Employee updatedEmployee = employeeService.updateEmployee(id, dto);
        return ResponseEntity.ok(employeeMapper.toDTO(updatedEmployee));
    }

    @PutMapping("/{id}/terminate")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR')")
    public ResponseEntity<EmployeeDTO> terminateEmployee(@PathVariable Long id) {
        log.info("Terminating employee with id: {}", id);
        Employee updatedEmployee = employeeService.terminateEmployee(id);
        return ResponseEntity.ok(employeeMapper.toDTO(updatedEmployee));
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR')")
    public ResponseEntity<EmployeeDTO> activateEmployee(@PathVariable Long id) {
        log.info("Activating employee with id: {}", id);
        Employee updatedEmployee = employeeService.activateEmployee(id);
        return ResponseEntity.ok(employeeMapper.toDTO(updatedEmployee));
    }

    @PostMapping("/{id}/resend")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR')")
    public ResponseEntity<MessageResponseDTO> resendActivationEmail(@PathVariable Long id) {
        log.info("Resending activation email to employee with id : {}", id);
        employeeService.resendActivationEmail(id);
        return ResponseEntity.ok(new MessageResponseDTO(true, "Aktivační email byl úspěšně odeslán"));
    }
}
