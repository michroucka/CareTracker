package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.employee.EmployeeDTO;
import cz.zcu.kiv.caretracker.dto.employee.EmployeeRequestDTO;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.mapper.EmployeeMapper;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class EmployeeService extends BaseRoleFilteringService<Employee, EmployeeDTO> {
    @Autowired
    private EmployeeRepository employeeRepository;
    @Autowired
    private EmployeeMapper employeeMapper;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private ClientRepository clientRepository;

    /**
     * Vrací zaměstnance filtrované podle role a organizačního kontextu přihlášeného uživatele.
     * - SUPERADMIN: Vidí všechny zaměstnance
     * - ADMIN: Vidí pouze zaměstnance z jeho organizace
     * - COORDINATOR: Vidí pouze zaměstnance z jeho oddělení
     * - CAREGIVER: Vidí pouze zaměstnance z jeho oddělení
     * - EMPLOYEE: Nemá přístup (ošetřeno na úrovni controlleru)
     */
    @Transactional(readOnly = true)
    protected List<EmployeeDTO> getEmployeesByRole(boolean activeOnly) {
        return filterEntitiesByRole(
                () -> activeOnly ? employeeRepository.findByActiveTrue() : employeeRepository.findAll(),
                orgId -> activeOnly ? employeeRepository.findByActiveTrueAndOrganizationId(orgId)
                        : employeeRepository.findByOrganizationId(orgId),
                deptId -> activeOnly ? employeeRepository.findByActiveTrueAndDepartmentId(deptId)
                        : employeeRepository.findByDepartmentId(deptId),
                employeeMapper::toDTOList
        );
    }

    /**
     * Vrací aktivní zaměstnance filtrované podle role a organizačního kontextu přihlášeného uživatele.
     */
    @Transactional(readOnly = true)
    public List<EmployeeDTO> getAllActiveEmployees() {
        return getEmployeesByRole(true);
    }

    /**
     * Vrací všechny zaměstnance (včetně neaktivních) filtrované podle role a organizačního kontextu přihlášeného uživatele.
     */
    @Transactional(readOnly = true)
    public List<EmployeeDTO> getAllEmployees() {
        return getEmployeesByRole(false);
    }

    /**
     * Vrací zaměstnance podle ID s kontrolou oprávnění.
     * Uživatel může vidět pouze zaměstnance, ke kterým má přístup podle své role.
     */
    @Transactional(readOnly = true)
    public Optional<EmployeeDTO> getEmployeeById(Long id) {
        return getEntityByIdWithPermissionCheck(
                id,
                () -> employeeRepository.findById(id),
                employee -> employee.getOrganization().getId(),
                employee -> employee.getDepartment().getId(),
                employeeMapper::toDTO
        );
    }

    private Employee saveEmployee(Employee employee, EmployeeRequestDTO dto) {
        Department department = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));

        // Validace, že department patří do organizace uživatele
        validateDepartmentAccess(
                department,
                dept -> dept.getOrganization().getId(),
                Department::getId
        );

        employeeMapper.requestToEmployee(employee, dto, department);

        return employeeRepository.save(employee);
    }

    public Employee createEmployee(EmployeeRequestDTO dto) {
        Employee employee = new Employee();
        return saveEmployee(employee, dto);
    }

    public Employee updateEmployee(Long id, EmployeeRequestDTO dto) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Validace, že má uživatel oprávnění upravit tohoto zaměstnance
        validateUpdateAccess(
                employee,
                emp -> emp.getOrganization().getId(),
                emp -> emp.getDepartment() != null ? emp.getDepartment().getId() : null
        );

        return saveEmployee(employee, dto);
    }

    public Employee terminateEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Validace oprávnění
        validateUpdateAccess(
                employee,
                emp -> emp.getOrganization().getId(),
                emp -> emp.getDepartment() != null ? emp.getDepartment().getId() : null
        );

        employee.setActive(false);

        return employeeRepository.save(employee);
    }

    public Employee activateEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Validace oprávnění
        validateUpdateAccess(
                employee,
                emp -> emp.getOrganization().getId(),
                emp -> emp.getDepartment() != null ? emp.getDepartment().getId() : null
        );

        employee.setActive(true);

        return employeeRepository.save(employee);
    }
}
