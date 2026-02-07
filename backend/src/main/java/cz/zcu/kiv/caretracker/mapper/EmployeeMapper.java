package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.employee.EmployeeDTO;
import cz.zcu.kiv.caretracker.dto.employee.EmployeeRequestDTO;
import cz.zcu.kiv.caretracker.dto.employee.EmployeeSummaryDTO;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class EmployeeMapper {
    @Autowired
    @Lazy
    DepartmentMapper departmentMapper;
    @Autowired
    OrganizationMapper organizationMapper;
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

        // Mapuj user info z připojeného User účtu
        if (employee.getUser() != null) {
            User user = employee.getUser();
            dto.setEmail(user.getEmail());
            dto.setIsAdmin(Objects.equals(user.getRole().toString(), "ADMIN"));
            dto.setIsActivated(user.getUsername() != null && !user.getUsername().isEmpty());
        }

        dto.setDepartment(departmentMapper.toSummaryDTO(employee.getDepartment()));

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

    public List<EmployeeSummaryDTO> toSummaryDTOList(List<Employee> employees) {
        if (employees == null) {
            return null;
        }

        return employees.stream()
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }
}
