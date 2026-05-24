package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.organization.OrganizationDTO;
import cz.zcu.kiv.caretracker.dto.organization.OrganizationRequestDTO;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.mapper.OrganizationMapper;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.OrganizationRepository;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

/**
 * Manages organizations (top-level tenants).
 * Handles manager role promotion/demotion as a side effect of organization create/update.
 */
@Service
public class OrganizationService extends BaseRoleFilteringService<Organization, OrganizationDTO> {
    @Autowired
    private OrganizationRepository organizationRepository;
    @Autowired
    private OrganizationMapper organizationMapper;
    @Autowired
    private EmployeeRepository employeeRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private DepartmentRepository departmentRepository;

    /**
     * Returns organizations visible to the current user, optionally filtered by active status.
     * Non-SUPERADMIN users see only their own organization.
     *
     * @param status {@code true} = active, {@code false} = inactive, {@code null} = all
     * @return list of organization DTOs
     */
    @Transactional(readOnly = true)
    public List<OrganizationDTO> getOrganizations(Boolean status) {
        RoleBasedFilters roleFilters = calculateRoleBasedFiltersOrganizationOnly(null);
        Long orgId = roleFilters.getOrganizationId();

        List<Organization> organizations;
        if (orgId == null) {
            if (status == null) {
                organizations = organizationRepository.findAll();
            } else {
                organizations = organizationRepository.findByActive(status);
            }
        } else {
            if (status == null) {
                organizations = organizationRepository.findById(orgId).map(List::of).orElse(List.of());
            } else {
                organizations = organizationRepository.findByIdAndActive(orgId, status).map(List::of).orElse(List.of());
            }
        }

        return organizationMapper.toDTOList(organizations);
    }

    /**
     * Returns a single organization by ID with role-based access control.
     * SUPERADMIN may access any organization; all other roles may only access their own.
     *
     * @param id the organization ID
     * @return the organization DTO, or empty if not found or inaccessible
     */
    @Transactional(readOnly = true)
    public java.util.Optional<OrganizationDTO> getOrganizationById(Long id) {
        return getEntityByIdWithPermissionCheck(
                id,
                () -> organizationRepository.findById(id),
                Organization::getId,
                organizationMapper::toDTO
        );
    }

    /**
     * Creates a new organization. Restricted to SUPERADMIN via {@code @PreAuthorize} in the controller.
     *
     * @param dto the organization creation data
     * @return the persisted organization entity
     */
    public Organization createOrganization(OrganizationRequestDTO dto) {
        Organization organization = new Organization();
        return saveOrganization(organization, dto);
    }

    /**
     * Updates an existing organization. Restricted to SUPERADMIN via {@code @PreAuthorize} in the controller.
     *
     * @param id the organization ID
     * @param dto updated organization data
     * @return the updated organization entity
     */
    public Organization updateOrganization(Long id, OrganizationRequestDTO dto) {
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organizace nebyla nalezena"));
        return saveOrganization(organization, dto);
    }

    /** Sets the active flag on an organization. */
    private Organization setOrganizationStatus(Long id, boolean status) {
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organizace nebyla nalezena"));

        organization.setActive(status);
        return organizationRepository.save(organization);
    }

    /**
     * Deactivates an organization and all its associated user accounts.
     * Restricted to SUPERADMIN via {@code @PreAuthorize} in the controller.
     *
     * @param id the organization ID
     * @return the updated organization entity
     */
    @Transactional
    public Organization terminateOrganization(Long id) {
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organizace nebyla nalezena"));

        List<User> users = new ArrayList<>();
        users.addAll(userRepository.findByEmployee_OrganizationId(id));
        users.addAll(userRepository.findByClient_OrganizationId(id));
        users.forEach(u -> u.setActive(false));
        userRepository.saveAll(users);

        organization.setActive(false);
        return organizationRepository.save(organization);
    }

    /**
     * Re-activates a previously deactivated organization.
     * Restricted to SUPERADMIN via {@code @PreAuthorize} in the controller.
     *
     * @param id the organization ID
     * @return the updated organization entity
     */
    public Organization activateOrganization(Long id) {
        return setOrganizationStatus(id, true);
    }

    /**
     * Promotes the new manager to MANAGER employee role and demotes the old one.
     * The old manager is demoted to COORDINATOR if they still coordinate a department, otherwise to CAREGIVER.
     * SUPERADMIN user accounts are never downgraded.
     * No-ops when old and new manager are the same person.
     */
    private void updateManagerRoles(Employee oldManager, Employee newManager) {
        Long oldId = oldManager != null ? oldManager.getId() : null;
        Long newId = newManager != null ? newManager.getId() : null;
        if (oldId != null && oldId.equals(newId)) return;

        if (oldManager != null) {
            EmployeeRole demotedRole = departmentRepository.existsByCoordinatorId(oldManager.getId())
                    ? EmployeeRole.COORDINATOR
                    : EmployeeRole.CAREGIVER;
            oldManager.setRole(demotedRole);
            employeeRepository.save(oldManager);
            User user = oldManager.getUser();
            if (user != null && user.getRole() != UserRole.SUPERADMIN) {
                user.setRole(demotedRole.toUserRole());
                userRepository.save(user);
            }
        }

        if (newManager != null) {
            newManager.setRole(EmployeeRole.MANAGER);
            employeeRepository.save(newManager);
            User user = newManager.getUser();
            if (user != null && user.getRole() != UserRole.SUPERADMIN) {
                user.setRole(UserRole.ADMIN);
                userRepository.save(user);
            }
        }
    }

    /**
     * Persists an organization from the supplied DTO, resolving the manager employee.
     * Triggers manager role promotion/demotion as a side effect.
     */
    private Organization saveOrganization(Organization organization, OrganizationRequestDTO dto) {
        Employee oldManager = organization.getManager();
        Employee newManager = dto.getManagerId() != null
                ? employeeRepository.findById(dto.getManagerId())
                        .orElseThrow(() -> new ResourceNotFoundException("Manažer nebyl nalezen"))
                : null;

        organizationMapper.requestToOrganization(organization, dto, newManager);
        Organization saved = organizationRepository.save(organization);

        updateManagerRoles(oldManager, newManager);

        return saved;
    }
}
