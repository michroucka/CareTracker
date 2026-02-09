package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.department.DepartmentDTO;
import cz.zcu.kiv.caretracker.dto.department.DepartmentRequestDTO;
import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.mapper.DepartmentMapper;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService extends BaseRoleFilteringService<Department, DepartmentDTO> {
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private DepartmentMapper departmentMapper;
    @Autowired
    private EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments(Long organizationId) {
        // Calculate filters based on user role
        RoleBasedFilters roleFilters = calculateRoleBasedFilters(organizationId, null);

        // If user has no access, return empty list
        if (roleFilters.isNoAccess()) {
            return List.of();
        }

        // Fetch departments based on computed organizationId
        List<Department> departments;
        if (roleFilters.getOrganizationId() != null) {
            departments = departmentRepository.findByOrganizationId(roleFilters.getOrganizationId());
        } else if (roleFilters.getDepartmentIds() != null && !roleFilters.getDepartmentIds().isEmpty()) {
            // COORDINATOR or CAREGIVER - return their department
            Long deptId = roleFilters.getDepartmentIds().get(0);
            departments = departmentRepository.findById(deptId)
                    .map(List::of)
                    .orElse(List.of());
        } else {
            // SUPERADMIN without organizationId filter - return all
            departments = departmentRepository.findAll();
        }

        return departmentMapper.toDTOList(departments);
    }

    @Transactional(readOnly = true)
    public Optional<DepartmentDTO> getDepartmentById(Long id) {
        return getEntityByIdWithPermissionCheck(
                id,
                () -> departmentRepository.findById(id),
                department -> department.getOrganization().getId(),
                departmentMapper::toDTO
        );
    }

    private Department saveDepartment(Department department, DepartmentRequestDTO dto) {
        User user = getCurrentUser();
        Employee employee = user.getEmployee();

        if (employee == null) {
            throw new SecurityException("Pouze zaměstnanci mohou vytvářet nebo upravovat oddělení");
        }

        Organization organization = employee.getOrganization();

        Employee coordinator = employeeRepository.findById(dto.getCoordinatorId())
                        .orElseThrow(() -> new ResourceNotFoundException("Zaměstnanec nebyl nalezen"));

        departmentMapper.requestToDepartment(department, dto, coordinator, organization);

        return departmentRepository.save(department);
    }

    public Department createDepartment(DepartmentRequestDTO dto) {
        Department department = new Department();
        return saveDepartment(department, dto);
    }

    public Department updateDepartment(Long id, DepartmentRequestDTO dto) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Oddělení nebylo nalezeno"));

        // Validace oprávnění
        validateOrganizationAccess(department, d -> d.getOrganization().getId());

        return saveDepartment(department, dto);
    }
}
