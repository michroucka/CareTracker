package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.employee.EmployeeDTO;
import cz.zcu.kiv.caretracker.dto.employee.EmployeeRequestDTO;
import cz.zcu.kiv.caretracker.dto.employee.EmployeeSummaryDTO;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
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

        // Mapuj organizaci
        if (employee.getOrganization() != null) {
            EmployeeDTO.OrganizationInfo orgInfo = new EmployeeDTO.OrganizationInfo();
            orgInfo.setId(employee.getOrganization().getId());
            orgInfo.setName(employee.getOrganization().getName());
            dto.setOrganization(orgInfo);
        }

        return dto;
    }

    /**
     * Převede Employee entitu na EmployeeSummaryDTO (pouze základní informace)
     */
    public EmployeeSummaryDTO toSummaryDTO(Employee employee) {
        if (employee == null) {
            return null;
        }

        EmployeeSummaryDTO dto = new EmployeeSummaryDTO();
        dto.setId(employee.getId());
        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());

        return dto;
    }

    public void requestToEmployee(Employee employee, EmployeeRequestDTO dto, Department department) {
        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        employee.setRole(EmployeeRole.valueOf(dto.getRole()));
        employee.setDepartment(department);
        employee.setOrganization(department.getOrganization());
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
