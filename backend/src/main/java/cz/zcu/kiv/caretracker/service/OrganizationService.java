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

import java.util.List;

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
     * Vrací organizaci podle ID s kontrolou oprávnění.
     * - SUPERADMIN: Vidí všechny organizace
     * - ADMIN/COORDINATOR/CAREGIVER: Mohou vidět pouze svoji organizaci
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
     * Vytvoří novou organizaci.
     * Pouze SUPERADMIN - kontrolováno @PreAuthorize v controlleru.
     */
    public Organization createOrganization(OrganizationRequestDTO dto) {
        Organization organization = new Organization();
        return saveOrganization(organization, dto);
    }

    /**
     * Upraví organizaci.
     * Pouze SUPERADMIN - kontrolováno @PreAuthorize v controlleru.
     */
    public Organization updateOrganization(Long id, OrganizationRequestDTO dto) {
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organizace nebyla nalezena"));
        return saveOrganization(organization, dto);
    }

    private Organization setOrganizationStatus(Long id, boolean status) {
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organizace nebyla nalezena"));

        organization.setActive(status);
        return organizationRepository.save(organization);
    }

    /**
     * Deaktivuje organizaci.
     * Pouze SUPERADMIN - kontrolováno @PreAuthorize v controlleru.
     */
    public Organization terminateOrganization(Long id) {
        return setOrganizationStatus(id, false);
    }

    /**
     * Aktivuje organizaci.
     * Pouze SUPERADMIN - kontrolováno @PreAuthorize v controlleru.
     */
    public Organization activateOrganization(Long id) {
        return setOrganizationStatus(id, true);
    }

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

    private Organization saveOrganization(Organization organization, OrganizationRequestDTO dto) {
        organization.setName(dto.getName());

        Employee oldManager = organization.getManager();
        Employee newManager = dto.getManagerId() != null
                ? employeeRepository.findById(dto.getManagerId())
                        .orElseThrow(() -> new ResourceNotFoundException("Manažer nebyl nalezen"))
                : null;

        organization.setManager(newManager);
        Organization saved = organizationRepository.save(organization);

        updateManagerRoles(oldManager, newManager);

        return saved;
    }
}
