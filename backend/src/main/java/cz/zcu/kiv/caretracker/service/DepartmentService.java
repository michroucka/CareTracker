package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.MessageResponseDTO;
import cz.zcu.kiv.caretracker.dto.department.DepartmentDTO;
import cz.zcu.kiv.caretracker.dto.department.DepartmentRequestDTO;
import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.mapper.DepartmentMapper;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.OrganizationRepository;
import cz.zcu.kiv.caretracker.repository.UserRepository;
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
    @Autowired
    private OrganizationRepository organizationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ClientRepository clientRepository;

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getDepartments(Long organizationId, Boolean status) {
        // Calculate filters based on user role
        RoleBasedFilters roleFilters = calculateRoleBasedFilters(organizationId, null);

        // If user has no access, return empty list
        if (roleFilters.isNoAccess()) {
            return List.of();
        }

        // Fetch departments based on computed organizationId
        Long orgId = roleFilters.getOrganizationId();
        List<Department> departments;
        if (status == null) {
            departments = departmentRepository.findByOrganizationId(orgId);
        } else if (status) {
            departments = departmentRepository.findByActiveTrueAndOrganizationId(orgId);
        } else {
            departments = departmentRepository.findByActiveFalseAndOrganizationId(orgId);
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

    private void updateCoordinatorRoles(Employee oldCoordinator, Employee newCoordinator) {
        Long oldId = oldCoordinator != null ? oldCoordinator.getId() : null;
        Long newId = newCoordinator != null ? newCoordinator.getId() : null;
        if (oldId != null && oldId.equals(newId)) return;

        if (oldCoordinator != null) {
            if (oldCoordinator.getRole() != EmployeeRole.MANAGER) {
                oldCoordinator.setRole(EmployeeRole.CAREGIVER);
                employeeRepository.save(oldCoordinator);
            }
            User user = oldCoordinator.getUser();
            if (user != null && user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.SUPERADMIN) {
                user.setRole(UserRole.CAREGIVER);
                userRepository.save(user);
            }
        }

        if (newCoordinator != null) {
            if (newCoordinator.getRole() != EmployeeRole.MANAGER) {
                newCoordinator.setRole(EmployeeRole.COORDINATOR);
                employeeRepository.save(newCoordinator);
            }
            User user = newCoordinator.getUser();
            if (user != null && user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.SUPERADMIN) {
                user.setRole(UserRole.COORDINATOR);
                userRepository.save(user);
            }
        }
    }

    private Department saveDepartment(Department department, DepartmentRequestDTO dto) {
        User user = getCurrentUser();

        Organization organization;
        if (user.getRole() == cz.zcu.kiv.caretracker.enums.UserRole.SUPERADMIN) {
            if (department.getOrganization() != null) {
                organization = department.getOrganization();
            } else if (dto.getOrganizationId() != null) {
                organization = organizationRepository.findById(dto.getOrganizationId())
                        .orElseThrow(() -> new ResourceNotFoundException("Organizace nebyla nalezena"));
            } else {
                throw new cz.zcu.kiv.caretracker.exception.ValidationException("Pro vytvoření střediska musí SUPERADMIN zvolit organizaci");
            }
        } else {
            Employee employee = user.getEmployee();
            if (employee == null) {
                throw new SecurityException("Pouze zaměstnanci mohou vytvářet nebo upravovat střediska");
            }
            organization = employee.getOrganization();
        }

        Employee oldCoordinator = department.getCoordinator();

        Employee coordinator = dto.getCoordinatorId() != null
                ? employeeRepository.findById(dto.getCoordinatorId())
                        .orElseThrow(() -> new ResourceNotFoundException("Zaměstnanec nebyl nalezen"))
                : null;

        departmentMapper.requestToDepartment(department, dto, coordinator, organization);
        Department saved = departmentRepository.save(department);

        updateCoordinatorRoles(oldCoordinator, coordinator);

        return saved;
    }

    public Department createDepartment(DepartmentRequestDTO dto) {
        Department department = new Department();
        return saveDepartment(department, dto);
    }

    public Department updateDepartment(Long id, DepartmentRequestDTO dto) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Oddělení nebylo nalezeno"));

        validateOrganizationAccess(department, d -> d.getOrganization().getId());

        return saveDepartment(department, dto);
    }

    private Department setDepartmentStatus(Long id, boolean status) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Oddělení nebylo nalezeno"));

        validateOrganizationAccess(department, dep -> dep.getOrganization().getId());

        department.setActive(status);
        return departmentRepository.save(department);
    }
    @Transactional
    public Department terminateDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Oddělení nebylo nalezeno"));

        validateOrganizationAccess(department, dep -> dep.getOrganization().getId());

        if (clientRepository.existsByDepartmentIdAndActiveTrue(id)) {
            throw new cz.zcu.kiv.caretracker.exception.ValidationException("Středisko má aktivní klienty. Deaktivujte je nebo přesuňte do jiného střediska.");
        }
        if (employeeRepository.existsByDepartmentIdAndActiveTrue(id)) {
            throw new cz.zcu.kiv.caretracker.exception.ValidationException("Středisko má aktivní zaměstnance. Deaktivujte je nebo přesuňte do jiného střediska.");
        }

        Employee oldCoordinator = department.getCoordinator();
        department.setCoordinator(null);
        department.setActive(false);
        Department saved = departmentRepository.save(department);
        updateCoordinatorRoles(oldCoordinator, null);
        return saved;
    }

    public Department activateDepartment(Long id) {
        return setDepartmentStatus(id, true);
    }
}
