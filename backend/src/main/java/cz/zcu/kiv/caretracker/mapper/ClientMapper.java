package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.client.ClientDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientRequestDTO;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.enums.BenefitLevel;
import cz.zcu.kiv.caretracker.enums.Gender;
import cz.zcu.kiv.caretracker.enums.TerminationReason;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ClientMapper {
    @Autowired
    DepartmentMapper departmentMapper;
    @Autowired
    EmployeeMapper employeeMapper;
    @Autowired
    TaskMapper taskMapper;

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
        dto.setHasPicture(client.getPicture() != null);

        // Mapování vnořených objektů
        dto.setDepartment(departmentMapper.toDTO(client.getDepartment()));
        dto.setCaregiver(employeeMapper.toDTO(client.getCaregiver()));
        dto.setTasks(taskMapper.toDTOList(client.getTasks()));

        return dto;
    }

    /**
     * Převede ClientRequest DTO na Client entitu
     */
    public void requestToClient(Client client,
                                ClientRequestDTO dto,
                                Department department,
                                Employee caregiver,
                                List<Task> tasks
    ) {
        client.setFirstName(dto.getFirstName());
        client.setLastName(dto.getLastName());
        client.setGender(Gender.valueOf(dto.getGender()));
        client.setDateOfBirth(dto.getDateOfBirth());
        client.setEmail(dto.getEmail());
        client.setPhone(dto.getPhone());
        client.setStreet(dto.getStreet());
        client.setCity(dto.getCity());
        client.setPostalCode(dto.getPostalCode());
        client.setLegallyCompetent(dto.getLegallyCompetent());
        client.setBenefits(BenefitLevel.valueOf(dto.getBenefits()));
        client.setRelativesContact(dto.getRelativesContact());
        client.setGeneralPractitioner(dto.getGeneralPractitioner());
        client.setNotes(dto.getNotes());
        client.setDepartment(department);
        client.setOrganization(department.getOrganization());
        client.setCaregiver(caregiver);
        client.setTasks(tasks);
        client.setTerminationDate(dto.getTerminationDate());
        client.setTerminationReason(dto.getTerminationReason() != null
                ? TerminationReason.valueOf(dto.getTerminationReason())
                : null
        );
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
