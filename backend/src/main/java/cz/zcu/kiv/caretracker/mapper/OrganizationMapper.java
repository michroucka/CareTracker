package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.organization.OrganizationDTO;
import cz.zcu.kiv.caretracker.dto.organization.OrganizationRequestDTO;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class OrganizationMapper {
    @Autowired
    EmployeeMapper employeeMapper;

    public OrganizationDTO toDTO(Organization organization) {
        if (organization == null) {
            return null;
        }

        OrganizationDTO dto = new OrganizationDTO();
        dto.setId(organization.getId());
        dto.setName(organization.getName());
        dto.setActive(organization.getActive());

        dto.setManager(employeeMapper.toDTO(organization.getManager()));

        return dto;
    }

    public void requestToOrganization(Organization organization, OrganizationRequestDTO dto, Employee manager) {
        organization.setName(dto.getName());
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
}
