package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.DepartmentDTO;
import cz.zcu.kiv.caretracker.dto.EmployeeDTO;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DepartmentMapper {
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

        return dto;
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
