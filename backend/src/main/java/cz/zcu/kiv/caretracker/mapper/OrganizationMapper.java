package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.organization.OrganizationDTO;
import cz.zcu.kiv.caretracker.dto.organization.OrganizationRequestDTO;
import cz.zcu.kiv.caretracker.dto.organization.OrganizationSummaryDTO;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class OrganizationMapper {
    @Autowired
    @Lazy
    EmployeeMapper employeeMapper;

    public OrganizationDTO toDTO(Organization organization) {
        if (organization == null) {
            return null;
        }

        OrganizationDTO dto = new OrganizationDTO();
        dto.setId(organization.getId());
        dto.setName(organization.getName());
        dto.setActive(organization.getActive());
        dto.setAccountPrefix(organization.getAccountPrefix());
        dto.setAccountNumber(organization.getAccountNumber());
        dto.setBankCode(organization.getBankCode());

        dto.setManager(employeeMapper.toSummaryDTO(organization.getManager()));

        return dto;
    }

    public OrganizationSummaryDTO toSummaryDTO(Organization organization) {
        if (organization == null) {
            return null;
        }

        OrganizationSummaryDTO dto = new OrganizationSummaryDTO();
        dto.setId(organization.getId());
        dto.setName(organization.getName());

        return dto;
    }

    public void requestToOrganization(Organization organization, OrganizationRequestDTO dto, Employee manager) {
        organization.setName(dto.getName());
        organization.setActive(dto.getActive());
        organization.setAccountPrefix(dto.getAccountPrefix());
        organization.setAccountNumber(dto.getAccountNumber());
        organization.setBankCode(dto.getBankCode());
        organization.setManager(manager);
    }

    public List<OrganizationDTO> toDTOList(List<Organization> organizations) {
        if (organizations == null) {
            return null;
        }

        return organizations.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<OrganizationSummaryDTO> toSummaryDTOList(List<Organization> organizations) {
        if (organizations == null) {
            return null;
        }

        return organizations.stream()
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }
}
