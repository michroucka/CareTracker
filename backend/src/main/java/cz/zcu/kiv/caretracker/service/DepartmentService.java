package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.department.DepartmentDTO;
import cz.zcu.kiv.caretracker.dto.department.DepartmentRequestDTO;
import cz.zcu.kiv.caretracker.entity.*;
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
    public List<DepartmentDTO> getAllDepartments() {
        return filterEntitiesByRole(
                departmentRepository::findAll,
                departmentRepository::findByOrganizationId,
                deptId -> departmentRepository.findById(deptId)
                        .map(List::of)
                        .orElse(List.of()),
                departmentMapper::toDTOList
        );
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
        Organization organization = user.getEmployee().getOrganization();

        Employee coordinator = employeeRepository.findById(dto.getCoordinatorId())
                        .orElseThrow(() -> new RuntimeException("Employee not found"));

        departmentMapper.requestToDepartment(department, dto, coordinator, organization);

        return departmentRepository.save(department);
    }

    public Department createDepartment(DepartmentRequestDTO dto) {
        Department department = new Department();
        return saveDepartment(department, dto);
    }

    public Department updateDepartment(Long id, DepartmentRequestDTO dto) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        // Validace oprávnění
        validateOrganizationAccess(department, d -> d.getOrganization().getId());

        return saveDepartment(department, dto);
    }
}
