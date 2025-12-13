package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.client.ClientDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientRequestDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientTerminateDTO;
import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.enums.BenefitLevel;
import cz.zcu.kiv.caretracker.enums.Gender;
import cz.zcu.kiv.caretracker.enums.TerminationReason;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.mapper.ClientMapper;
import cz.zcu.kiv.caretracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private ClientMapper clientMapper;

    @Autowired
    private UserRepository userRepository;

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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new SecurityException("User is not authenticated");
        }

        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<Client> clients;
        UserRole role = user.getRole();

        // SUPERADMIN má přístup ke všemu
        if (role == UserRole.SUPERADMIN) {
            clients = activeOnly ? clientRepository.findByActiveTrue() : clientRepository.findAll();
        }
        // Zaměstnanci - filtrování podle organizace/oddělení
        else if (user.getEmployee() != null) {
            // ADMIN vidí klienty celé organizace
            if (role == UserRole.ADMIN) {
                if (user.getEmployee().getOrganization() == null) {
                    throw new SecurityException("Admin must have an associated organization");
                }
                Long organizationId = user.getEmployee().getOrganization().getId();
                clients = activeOnly
                    ? clientRepository.findByActiveTrueAndOrganizationId(organizationId)
                    : clientRepository.findByOrganizationId(organizationId);
            }
            // COORDINATOR a CAREGIVER vidí pouze klienty ze svého oddělení
            else if (role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getDepartment() == null) {
                    throw new SecurityException("Employee must have an associated department");
                }
                Long departmentId = user.getEmployee().getDepartment().getId();
                clients = activeOnly
                    ? clientRepository.findByActiveTrueAndDepartmentId(departmentId)
                    : clientRepository.findByDepartmentId(departmentId);
            }
            else {
                throw new SecurityException("Unauthorized employee role");
            }
        }
        // CLIENT role nemá přístup k seznamu klientů
        else {
            throw new SecurityException("User does not have permission to view clients");
        }

        return clientMapper.toDTOList(clients);
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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new SecurityException("User is not authenticated");
        }

        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Optional<Client> clientOpt = clientRepository.findById(id);

        if (clientOpt.isEmpty()) {
            return Optional.empty();
        }

        Client client = clientOpt.get();
        UserRole role = user.getRole();

        // SUPERADMIN má přístup ke všemu
        if (role == UserRole.SUPERADMIN) {
            return Optional.of(clientMapper.toDTO(client));
        }

        // Zaměstnanci - kontrola přístupu podle organizace/oddělení
        if (user.getEmployee() != null) {
            // ADMIN může vidět klienty z celé organizace
            if (role == UserRole.ADMIN) {
                if (user.getEmployee().getOrganization() == null) {
                    throw new SecurityException("Admin must have an associated organization");
                }

                Long userOrgId = user.getEmployee().getOrganization().getId();
                Long clientOrgId = client.getOrganization().getId();

                if (userOrgId.equals(clientOrgId)) {
                    return Optional.of(clientMapper.toDTO(client));
                } else {
                    throw new SecurityException("Access denied: Client is from a different organization");
                }
            }

            // COORDINATOR a CAREGIVER mohou vidět pouze klienty ze svého oddělení
            if (role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getDepartment() == null) {
                    throw new SecurityException("Employee must have an associated department");
                }

                Long userDeptId = user.getEmployee().getDepartment().getId();
                Long clientDeptId = client.getDepartment().getId();

                if (userDeptId.equals(clientDeptId)) {
                    return Optional.of(clientMapper.toDTO(client));
                } else {
                    throw new SecurityException("Access denied: Client is from a different department");
                }
            }
        }

        throw new SecurityException("User does not have permission to view this client");
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
