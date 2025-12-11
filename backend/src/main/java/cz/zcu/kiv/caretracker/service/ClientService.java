package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.ClientDTO;
import cz.zcu.kiv.caretracker.dto.ClientRequestDTO;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.BenefitLevel;
import cz.zcu.kiv.caretracker.enums.Gender;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.mapper.ClientMapper;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    /**
     * Vrací aktivní klienty filtrované podle role a organizačního kontextu přihlášeného uživatele.
     * - SUPERADMIN: Vidí všechny klienty
     * - ADMIN: Vidí pouze klienty z jeho organizace
     * - COORDINATOR: Vidí pouze klienty z jeho oddělení
     * - CAREGIVER: Vidí pouze klienty z jeho oddělení
     * - CLIENT: Nemá přístup (ošetřeno na úrovni controlleru)
     */
    @Transactional(readOnly = true)
    public List<ClientDTO> getAllActiveClients() {
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
            clients = clientRepository.findByActiveTrue();
        }
        // Zaměstnanci - filtrování podle organizace/oddělení
        else if (user.getEmployee() != null) {
            // ADMIN vidí klienty celé organizace
            if (role == UserRole.ADMIN) {
                if (user.getEmployee().getDepartment() == null ||
                        user.getEmployee().getDepartment().getOrganization() == null) {
                    throw new SecurityException("Admin must have an associated organization");
                }
                Long organizationId = user.getEmployee().getDepartment().getOrganization().getId();
                clients = clientRepository.findByActiveTrueAndOrganizationId(organizationId);
            }
            // COORDINATOR a CAREGIVER vidí pouze klienty ze svého oddělení
            else if (role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getDepartment() == null) {
                    throw new SecurityException("Employee must have an associated department");
                }
                Long departmentId = user.getEmployee().getDepartment().getId();
                clients = clientRepository.findByActiveTrueAndDepartmentId(departmentId);
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

    public List<ClientDTO> getAllClients() {
        List<Client> clients = clientRepository.findAll();
        return clientMapper.toDTOList(clients);
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
                if (user.getEmployee().getDepartment() == null ||
                        user.getEmployee().getDepartment().getOrganization() == null) {
                    throw new SecurityException("Admin must have an associated organization");
                }

                Long userOrgId = user.getEmployee().getDepartment().getOrganization().getId();
                Long clientOrgId = client.getDepartment().getOrganization().getId();

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

    public Client createClient(ClientRequestDTO dto) {
        Client client = new Client();

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

        Department department = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));
        client.setDepartment(department);
        client.setOrganization(department.getOrganization());

        Employee caregiver = employeeRepository.findById(dto.getCaregiverId())
                .orElseThrow(() -> new RuntimeException("Caregiver not found"));
        client.setCaregiver(caregiver);

        // Set personalNumber if provided, otherwise use ID after save
        if (dto.getPersonalNumber() != null) {
            client.setPersonalNumber(dto.getPersonalNumber());
            return clientRepository.save(client);
        } else {
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
    }

    public Client updateClient(Long id, Client clientDetails) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        client.setFirstName(clientDetails.getFirstName());
        client.setLastName(clientDetails.getLastName());
        client.setGender(clientDetails.getGender());
        client.setPersonalNumber(clientDetails.getPersonalNumber());
        client.setDateOfBirth(clientDetails.getDateOfBirth());
        client.setDateOfDeath(clientDetails.getDateOfDeath());
        client.setEmail(clientDetails.getEmail());
        client.setPhone(clientDetails.getPhone());
        client.setStreet(clientDetails.getStreet());
        client.setCity(clientDetails.getCity());
        client.setPostalCode(clientDetails.getPostalCode());
        client.setLegallyCompetent(clientDetails.getLegallyCompetent());
        client.setBenefits(clientDetails.getBenefits());
        client.setRelativesContact(clientDetails.getRelativesContact());
        client.setGeneralPractitioner(clientDetails.getGeneralPractitioner());
        client.setNotes(clientDetails.getNotes());
        client.setActive(clientDetails.getActive());
        client.setDepartment(clientDetails.getDepartment());
        client.setCaregiver(clientDetails.getCaregiver());

        return clientRepository.save(client);
    }

    public void deleteClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        client.setActive(false);
        clientRepository.save(client);
    }
}
