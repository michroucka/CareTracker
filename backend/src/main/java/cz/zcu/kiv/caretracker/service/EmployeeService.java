package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.employee.EmployeeDTO;
import cz.zcu.kiv.caretracker.dto.employee.EmployeeRequestDTO;
import cz.zcu.kiv.caretracker.dto.picture.PictureDTO;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Picture;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.mapper.EmployeeMapper;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.PictureRepository;
import cz.zcu.kiv.caretracker.specification.EmployeeSpecifications;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
    private UserService userService;
    @Autowired
    private PictureService pictureService;
    @Autowired
    private PictureRepository pictureRepository;
    @Autowired
    private EntityManager entityManager;

    /**
     * Returns employees filtered by the current user's role and the supplied optional criteria.
     * <p>
     * SUPERADMIN: may filter by {@code organizationId}, {@code status}, {@code departmentIds}.<br>
     * ADMIN: scoped to own organization; may filter by {@code status} and {@code departmentIds}.<br>
     * COORDINATOR: scoped to own department; may filter by {@code status}.<br>
     * CAREGIVER: scoped to own department, active employees only.
     *
     * @param organizationId optional organization filter (SUPERADMIN only)
     * @param status {@code true} = active, {@code false} = inactive, {@code null} = all (CAREGIVER always sees active)
     * @param departmentIds optional department filter
     * @return role-filtered list of employee DTOs
     */
    @Transactional(readOnly = true)
    public List<EmployeeDTO> getEmployees(Long organizationId, Boolean status, List<Long> departmentIds) {
        RoleBasedFilters roleFilters = calculateRoleBasedFilters(organizationId, departmentIds);

        if (roleFilters.isNoAccess()) {
            return Collections.emptyList();
        }

        // CAREGIVERs may not see inactive employees
        if (getCurrentUser().getRole() == UserRole.CAREGIVER) {
            status = true;
        }

        Specification<Employee> spec = EmployeeSpecifications.withFilters(
                roleFilters.getOrganizationId(),
                roleFilters.getDepartmentIds(),
                status
        );

        List<Employee> employees = employeeRepository.findAll(spec);
        return employeeMapper.toDTOList(employees);
    }

    /**
     * Returns a single employee by ID, applying role-based department-level access control.
     *
     * @param id the employee ID
     * @return the employee DTO, or empty if not found or the user lacks access
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

    /**
     * Persists an employee entity from the supplied DTO.
     * After saving, the entity is detached and reloaded so that all lazy associations
     * (including the newly created user account) are visible in the returned object.
     */
    private Employee saveEmployee(Employee employee, EmployeeRequestDTO dto) {
        Department department = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Oddělení nebylo nalezeno"));

        validateDepartmentAccess(
                department,
                dept -> dept.getOrganization().getId(),
                Department::getId
        );
        validateRoleAssignment(employee, dto);

        employeeMapper.requestToEmployee(employee, dto, department);
        employee = employeeRepository.save(employee);

        handleUserAccount(employee, dto);

        // Flush and reload to ensure the user account link is reflected in the returned entity
        entityManager.flush();
        entityManager.detach(employee);

        employee = employeeRepository.findById(employee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Zaměstnanec nebyl nalezen"));

        return employee;
    }

    /**
     * Only admins may hand out the COORDINATOR or MANAGER role and the administrator flag.
     * A coordinator may keep an employee's current role, mirroring the employee form.
     *
     * @throws SecurityException if a coordinator tries to raise the role or change the administrator flag
     */
    private void validateRoleAssignment(Employee employee, EmployeeRequestDTO dto) {
        if (isCurrentUserAdmin()) {
            return;
        }

        EmployeeRole requestedRole = EmployeeRole.valueOf(dto.getRole());
        if (requestedRole != EmployeeRole.CAREGIVER && requestedRole != employee.getRole()) {
            throw new SecurityException("Tuto roli může přidělit jen administrátor");
        }

        if (hasEmail(dto) && Boolean.TRUE.equals(dto.getIsAdmin())) {
            throw new SecurityException("Administrátora může přidělit jen administrátor");
        }
    }

    /**
     * Administrators may be changed only by administrators, otherwise a coordinator could e.g. change
     * the administrator's e-mail and take over the account through a password reset.
     *
     * @throws SecurityException if a non-admin user tries to change an administrator
     */
    private void validateAdminChangedOnlyByAdmin(Employee employee) {
        if (hasAdminAccount(employee) && !isCurrentUserAdmin()) {
            throw new SecurityException("Administrátora může upravit jen administrátor");
        }
    }

    private boolean isCurrentUserAdmin() {
        UserRole role = getCurrentUser().getRole();
        return role == UserRole.ADMIN || role == UserRole.SUPERADMIN;
    }

    private static boolean hasAdminAccount(Employee employee) {
        User account = employee.getUser();
        return account != null && account.getRole() == UserRole.ADMIN;
    }

    private static boolean hasEmail(EmployeeRequestDTO dto) {
        return dto.getEmail() != null && !dto.getEmail().trim().isEmpty();
    }

    /**
     * Creates, updates, or skips the {@link cz.zcu.kiv.caretracker.entity.User} account for an employee
     * based on whether an email is provided in the DTO.
     */
    private void handleUserAccount(Employee employee, EmployeeRequestDTO dto) {
        if (hasEmail(dto)) {
            if (employee.getUser() == null) {
                userService.createUserForEmployee(employee, dto.getEmail(), dto.getIsAdmin());
            } else {
                userService.updateUserForEmployee(employee, dto.getEmail(), dto.getIsAdmin());
            }
        }
    }

    /**
     * Creates a new employee from the supplied request DTO.
     *
     * @param dto the employee creation data
     * @return the persisted employee entity
     */
    @Transactional
    public Employee createEmployee(EmployeeRequestDTO dto) {
        Employee employee = new Employee();
        return saveEmployee(employee, dto);
    }

    /**
     * Updates an existing employee, applying role-based write access validation.
     *
     * @param id the employee ID
     * @param dto updated employee data
     * @return the updated employee entity
     * @throws ResourceNotFoundException if the employee does not exist
     * @throws SecurityException if the user does not have write access
     */
    @Transactional
    public Employee updateEmployee(Long id, EmployeeRequestDTO dto) {
        return saveEmployee(findManageableEmployee(id), dto);
    }

    /**
     * Sets the active status of an employee and mirrors the change to their user account if one exists.
     */
    private Employee setEmployeeStatus(Long id, boolean status) {
        Employee employee = findManageableEmployee(id);
        employee.setActive(status);

        if (employee.getUser() != null) {
            if (status) {
                userService.activateUserForEmployee(employee);
            } else {
                userService.deactivateUserForEmployee(employee);
            }
        }

        return employeeRepository.save(employee);
    }

    /**
     * Deactivates an employee and their associated user account.
     *
     * @param id the employee ID
     * @return the updated employee entity
     */
    public Employee terminateEmployee(Long id) {
        return setEmployeeStatus(id, false);
    }

    /**
     * Re-activates an employee and their associated user account.
     *
     * @param id the employee ID
     * @return the updated employee entity
     */
    public Employee activateEmployee(Long id) {
        return setEmployeeStatus(id, true);
    }

    /**
     * Resends the account activation email for the employee's user account.
     *
     * @param id the employee ID
     * @throws ResourceNotFoundException if the employee does not exist
     */
    public void resendActivationEmail(Long id) {
        Employee employee = findManageableEmployee(id);
        userService.resendActivationEmail(employee.getUser());
    }

    /**
     * Returns the employee's profile picture in the requested size.
     *
     * @throws ResourceNotFoundException if the employee or the picture does not exist
     * @throws SecurityException if the user does not have access to this employee
     */
    @Transactional
    public byte[] getPictureContent(Long employeeId, PictureService.Size size) {
        Picture picture = findAccessibleEmployee(employeeId).getPicture();
        if (picture == null) {
            throw new ResourceNotFoundException("Obrázek nenalezen");
        }
        return pictureService.getContent(picture, size);
    }

    /** Replaces the employee's profile picture with a resized copy of the upload. */
    @Transactional
    public PictureDTO setPicture(Long employeeId, MultipartFile file) throws IOException {
        return replacePicture(findManageableEmployee(employeeId), file);
    }

    /** Removes the employee's profile picture. */
    @Transactional
    public void deletePicture(Long employeeId) {
        removePicture(findManageableEmployee(employeeId));
    }

    /** Replaces the profile picture of the signed-in employee (Můj účet). */
    @Transactional
    public PictureDTO setOwnPicture(MultipartFile file) throws IOException {
        return replacePicture(currentEmployee(), file);
    }

    /** Removes the profile picture of the signed-in employee. */
    @Transactional
    public void deleteOwnPicture() {
        removePicture(currentEmployee());
    }

    private PictureDTO replacePicture(Employee employee, MultipartFile file) throws IOException {
        Picture picture = pictureRepository.save(pictureService.createPicture(file));
        // the previous picture is an orphan now and gets deleted with the employee update
        employee.setPicture(picture);
        return PictureDTO.of(picture);
    }

    private void removePicture(Employee employee) {
        if (employee.getPicture() == null) {
            throw new ResourceNotFoundException("Obrázek nenalezen");
        }
        employee.setPicture(null);
    }

    private Employee findAccessibleEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Zaměstnanec nebyl nalezen"));
        validateDepartmentAccess(
                employee,
                emp -> emp.getOrganization().getId(),
                emp -> emp.getDepartment() != null ? emp.getDepartment().getId() : null
        );
        return employee;
    }

    /** Employee the current user may change: within their scope and not an administrator unless they are one. */
    private Employee findManageableEmployee(Long employeeId) {
        Employee employee = findAccessibleEmployee(employeeId);
        validateAdminChangedOnlyByAdmin(employee);
        return employee;
    }

    private Employee currentEmployee() {
        Employee employee = getCurrentUser().getEmployee();
        if (employee == null) {
            throw new ResourceNotFoundException("Účet nepatří zaměstnanci");
        }
        return employeeRepository.findById(employee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Zaměstnanec nebyl nalezen"));
    }
}
