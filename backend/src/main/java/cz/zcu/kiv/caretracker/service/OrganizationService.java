package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.organization.OrganizationDTO;
import cz.zcu.kiv.caretracker.dto.organization.OrganizationRequestDTO;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.mapper.OrganizationMapper;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.OrganizationRepository;
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

    /**
     * Vrací organizace podle role:
     * - SUPERADMIN: Vidí všechny organizace
     * - ADMIN/COORDINATOR/CAREGIVER: Vidí pouze svoji organizaci
     */
    @Transactional(readOnly = true)
    public List<OrganizationDTO> getAllOrganizations() {
        return filterEntitiesByRole(
                organizationRepository::findAll,
                orgId -> organizationRepository.findById(orgId)
                        .map(List::of)
                        .orElse(List.of()),
                organizationMapper::toDTOList
        );
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

    private Organization saveOrganization(Organization organization, OrganizationRequestDTO dto) {
        organization.setName(dto.getName());

        if (dto.getManagerId() != null) {
            cz.zcu.kiv.caretracker.entity.Employee manager = employeeRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manažer nebyl nalezen"));
            organization.setManager(manager);
        }

        return organizationRepository.save(organization);
    }
}
