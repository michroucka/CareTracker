package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.department.DepartmentDTO;
import cz.zcu.kiv.caretracker.dto.department.DepartmentRequestDTO;
import cz.zcu.kiv.caretracker.dto.department.DepartmentSummaryDTO;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DepartmentMapper {
    @Autowired
    OrganizationMapper organizationMapper;

    /**
     * Převede Department entitu na DepartmentDTO
     */
    public DepartmentDTO toDTO(Department department) {
        if (department == null) {
            return null;
        }

        DepartmentDTO dto = new DepartmentDTO();
        dto.setId(department.getId());

        // Kombinuj adresu
        String address = String.format("%s, %s %s",
                department.getStreet(),
                department.getPostalCode(),
                department.getCity());
        dto.setAddress(address);

        // Použij město jako jméno oddělení (můžeš změnit podle potřeby)
        dto.setName(department.getCity());

        // Mapuj organizaci
        if (department.getOrganization() != null) {
            dto.setOrganization(organizationMapper.toSummaryDTO(department.getOrganization()));
        }

        return dto;
    }

    public DepartmentSummaryDTO toSummaryDTO(Department department) {
        if (department == null) {
            return null;
        }

        DepartmentSummaryDTO dto = new DepartmentSummaryDTO();
        dto.setId(department.getId());
        dto.setName(department.getCity());
        dto.setOrganizationId(department.getOrganization().getId());

        return dto;
    }

    public void requestToDepartment(Department department, DepartmentRequestDTO dto, Employee coordinator, Organization organization) {
        department.setStreet(dto.getStreet());
        department.setCity(dto.getCity());
        department.setPostalCode(dto.getPostalCode());
        department.setCoordinator(coordinator);
        department.setOrganization(organization);
    }

    public List<DepartmentDTO> toDTOList(List<Department> departments) {
        if (departments == null) {
            return null;
        }

        return departments.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}
