package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.TaskDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientRequestDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientTerminateDTO;
import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.enums.TerminationReason;
import cz.zcu.kiv.caretracker.mapper.ClientMapper;
import cz.zcu.kiv.caretracker.mapper.TaskMapper;
import cz.zcu.kiv.caretracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ClientService extends BaseRoleFilteringService<Client, ClientDTO> {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private ClientMapper clientMapper;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TaskRepository taskRepository;

    /**
     * Vrací klienty filtrované podle role a organizačního kontextu přihlášeného uživatele.
     * - SUPERADMIN: Vidí všechny klienty
     * - ADMIN: Vidí pouze klienty z jeho organizace
     * - COORDINATOR: Vidí pouze klienty z jeho oddělení
     * - CAREGIVER: Vidí pouze klienty z jeho oddělení
     * - CLIENT: Nemá přístup (ošetřeno na úrovni controlleru)
     */
    @Transactional(readOnly = true)
    protected List<ClientDTO> getClientsByRole(boolean activeOnly) {
        return filterEntitiesByRole(
                () -> activeOnly ? clientRepository.findByActiveTrue() : clientRepository.findAll(),
                orgId -> activeOnly ? clientRepository.findByActiveTrueAndOrganizationId(orgId)
                                    : clientRepository.findByOrganizationId(orgId),
                deptId -> activeOnly ? clientRepository.findByActiveTrueAndDepartmentId(deptId)
                                     : clientRepository.findByDepartmentId(deptId),
                clientMapper::toDTOList
        );
    }

    /**
     * Vrací aktivní klienty filtrované podle role a organizačního kontextu přihlášeného uživatele.
     */
    @Transactional(readOnly = true)
    public List<ClientDTO> getAllActiveClients() {
        return getClientsByRole(true);
    }

    /**
     * Vrací všechny klienty (včetně neaktivních) filtrované podle role a organizačního kontextu přihlášeného uživatele.
     */
    @Transactional(readOnly = true)
    public List<ClientDTO> getAllClients() {
        return getClientsByRole(false);
    }

    /**
     * Vrací klienta podle ID s kontrolou oprávnění.
     * Uživatel může vidět pouze klienty, ke kterým má přístup podle své role.
     */
    @Transactional(readOnly = true)
    public Optional<ClientDTO> getClientById(Long id) {
        return getEntityByIdWithPermissionCheck(
                id,
                () -> clientRepository.findById(id),
                client -> client.getOrganization().getId(),
                client -> client.getDepartment().getId(),
                clientMapper::toDTO
        );
    }

    private Client saveClient(Client client, ClientRequestDTO dto) {
        Department department = departmentRepository.findById(dto.getDepartmentId())
                        .orElseThrow(() -> new RuntimeException("Department not found"));
        Employee caregiver = employeeRepository.findById(dto.getCaregiverId())
                        .orElseThrow(() -> new RuntimeException("Employee not found"));
        List<Task> tasks = new ArrayList<>();
        for (Long taskId : dto.getTaskIds()) {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found"));

            tasks.add(task);
        }

        clientMapper.requestToClient(client, dto, department, caregiver, tasks);

        // Set personalNumber if provided, otherwise use ID after save
        if (dto.getPersonalNumber() != null) {
            client.setPersonalNumber(dto.getPersonalNumber());
        } else if (client.getPersonalNumber() == null){
            // Save first to generate ID, then set personalNumber to ID
            Client savedClient = clientRepository.save(client);
            Long organizationId = savedClient.getOrganization().getId();
            Long personalNumber = savedClient.getId();

            // Kontrola jestli personalNumber už neexistuje v rámci organizace (pouze u aktivních klientů)
            while (clientRepository.existsByPersonalNumberAndOrganizationIdAndActiveTrue(personalNumber, organizationId)) {
                personalNumber++;
            }

            savedClient.setPersonalNumber(personalNumber);
            return clientRepository.save(savedClient);
        }

        return clientRepository.save(client);
    }

    public Client createClient(ClientRequestDTO dto) {
        Client client = new Client();
        return saveClient(client, dto);
    }

    public Client updateClient(Long id, ClientRequestDTO dto) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        return saveClient(client, dto);
    }

    public Client terminateClient(Long id, ClientTerminateDTO dto) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        client.setActive(false);
        client.setTerminationDate(dto.getTerminationDate());
        client.setTerminationReason(TerminationReason.valueOf(dto.getTerminationReason()));

        return clientRepository.save(client);
    }

    public Client activateClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        client.setActive(true);
        client.setTerminationDate(null);
        client.setTerminationReason(null);

        return clientRepository.save(client);
    }
}
