package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.ClientDTO;
import cz.zcu.kiv.caretracker.dto.DepartmentDTO;
import cz.zcu.kiv.caretracker.dto.EmployeeDTO;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ClientMapper {

    /**
     * Převede Client entitu na ClientDTO
     */
    public ClientDTO toDTO(Client client) {
        if (client == null) {
            return null;
        }

        ClientDTO dto = new ClientDTO();
        dto.setId(client.getId());
        dto.setFirstName(client.getFirstName());
        dto.setLastName(client.getLastName());
        dto.setGender(client.getGender() != null ? client.getGender().name() : null);
        dto.setPersonalNumber(client.getPersonalNumber());
        dto.setDateOfBirth(client.getDateOfBirth());
        dto.setTerminationDate(client.getTerminationDate());
        dto.setTerminationReason(client.getTerminationReason() != null ? client.getTerminationReason().name() : null);
        dto.setEmail(client.getEmail());
        dto.setPhone(client.getPhone());
        dto.setStreet(client.getStreet());
        dto.setCity(client.getCity());
        dto.setPostalCode(client.getPostalCode());
        dto.setLegallyCompetent(client.getLegallyCompetent());
        dto.setBenefits(client.getBenefits() != null ? client.getBenefits().name() : null);
        dto.setRelativesContact(client.getRelativesContact());
        dto.setGeneralPractitioner(client.getGeneralPractitioner());
        dto.setNotes(client.getNotes());
        dto.setCreated(client.getCreated());
        dto.setActive(client.getActive());

        // Mapování vnořených objektů
        dto.setDepartment(toDepartmentDTO(client.getDepartment()));
        dto.setCaregiver(toEmployeeDTO(client.getCaregiver()));

        return dto;
    }

    /**
     * Převede Department entitu na DepartmentDTO
     */
    private DepartmentDTO toDepartmentDTO(Department department) {
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

    /**
     * Převede Employee entitu na EmployeeDTO
     */
    private EmployeeDTO toEmployeeDTO(Employee employee) {
        if (employee == null) {
            return null;
        }

        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(employee.getId());
        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());
        dto.setRole(employee.getRole() != null ? employee.getRole().name() : null);

        return dto;
    }

    /**
     * Převede seznam Client entit na seznam ClientDTO
     */
    public List<ClientDTO> toDTOList(List<Client> clients) {
        if (clients == null) {
            return null;
        }

        return clients.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}
