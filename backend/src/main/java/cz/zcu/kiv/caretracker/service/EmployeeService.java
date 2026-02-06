package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.employee.EmployeeDTO;
import cz.zcu.kiv.caretracker.dto.employee.EmployeeRequestDTO;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.mapper.EmployeeMapper;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.TaskRepository;
import cz.zcu.kiv.caretracker.specification.EmployeeSpecifications;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
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
    @Autowired
    private UserService userService;

    /**
     * Vrací zamestnance filtrované podle role, organizačního kontextu a dalších kritérií.
     * Používá JPA Specifications pro flexibilní a efektivní filtrování na úrovni databáze.
     *
     * - SUPERADMIN: Může filtrovat podle organizationId (nebo vidět vše), status, departmentIds
     * - ADMIN: Vidí pouze svou organizaci, může filtrovat podle status, departmentIds
     * - COORDINATOR: Vidí pouze své oddělení, může filtrovat podle status
     * - CAREGIVER: Vidí pouze své oddělení a pouze aktivní klienty
     *
     * @param organizationId Volitelné ID organizace pro filtrování (pouze pro SUPERADMIN)
     * @param status Volitelný status zamestnance (true = aktivní, false = neaktivní, null = všichni) - pro CAREGIVER vždy vynuceno na true
     * @param departmentIds Volitelný seznam ID oddělení pro filtrování
     * @return Seznam EmployeeDTO filtrovaných podle kritérií
     */
    @Transactional(readOnly = true)
    public List<EmployeeDTO> getEmployees(Long organizationId, Boolean status, List<Long> departmentIds) {
        // Vypočítat filtry podle role uživatele
        RoleBasedFilters roleFilters = calculateRoleBasedFilters(organizationId, departmentIds);

        // Pokud uživatel nemá přístup, vrať prázdný seznam
        if (roleFilters.isNoAccess()) {
            return Collections.emptyList();
        }

        // Validace status parametru podle role
        // CAREGIVER nemá přístup k neaktivním zamestnancum
        Employee currentUser = getCurrentUser().getEmployee();
        if (currentUser.getRole() == EmployeeRole.CAREGIVER) {
            status = true;
        }

        // Sestavit specification s filtry
        Specification<Employee> spec = EmployeeSpecifications.withFilters(
                roleFilters.getOrganizationId(),
                roleFilters.getDepartmentIds(),
                status
        );

        // Provést dotaz a převést na DTO
        List<Employee> employees = employeeRepository.findAll(spec);
        return employeeMapper.toDTOList(employees);
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
        employee = employeeRepository.save(employee);

        // Zpracování User účtu
        handleUserAccount(employee, dto);

        return employee;
    }

    /**
     * Zpracuje vytvoření/aktualizaci/smazání User účtu pro zaměstnance.
     */
    private void handleUserAccount(Employee employee, EmployeeRequestDTO dto) {
        if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty()) {
            // Uživatel chce vytvořit/aktualizovat účet
            if (employee.getUser() == null) {
                // Vytvoř nový User účet
                userService.createUserForEmployee(employee, dto.getEmail(), dto.getIsAdmin());
            } else {
                // Aktualizuj existující User účet
                userService.updateUserForEmployee(employee, dto.getEmail(), dto.getIsAdmin());
            }
        }
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
        userService.deactivateUserForEmployee(employee);

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
        userService.activateUserForEmployee(employee);

        return employeeRepository.save(employee);
    }
}
