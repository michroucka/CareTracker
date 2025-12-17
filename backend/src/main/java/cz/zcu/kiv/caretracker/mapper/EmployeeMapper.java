package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.EmployeeDTO;
import cz.zcu.kiv.caretracker.entity.Employee;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class EmployeeMapper {
    @Autowired
    DepartmentMapper departmentMapper;
    /**
     * Převede Employee entitu na EmployeeDTO
     */
    public EmployeeDTO toDTO(Employee employee) {
        if (employee == null) {
            return null;
        }

        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(employee.getId());
        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());
        dto.setRole(employee.getRole() != null ? employee.getRole().name() : null);
        dto.setActive(employee.getActive());

        dto.setDepartment(departmentMapper.toDTO(employee.getDepartment()));

        return dto;
    }

    public List<EmployeeDTO> toDTOList(List<Employee> employees) {
        if (employees == null) {
            return null;
        }

        return employees.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}
