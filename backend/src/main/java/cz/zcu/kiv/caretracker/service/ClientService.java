package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.client.ClientDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientRequestDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientTerminateDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.DailyRecordRequestDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanContentDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanContentRequestDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanVersionSummaryDTO;
import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.enums.TerminationReason;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.mapper.ClientMapper;
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
    @Autowired
    private IndividualPlanRepository individualPlanRepository;
    @Autowired
    private cz.zcu.kiv.caretracker.mapper.IndividualPlanMapper individualPlanMapper;
    @Autowired
    private cz.zcu.kiv.caretracker.mapper.IndividualPlanContentMapper individualPlanContentMapper;
    @Autowired
    private DailyRecordRepository dailyRecordRepository;

    /**
     * Vrací klienty filtrované podle role a organizačního kontextu přihlášeného uživatele.
     * - SUPERADMIN: Vidí všechny klienty, nebo klienty z konkrétní organizace pokud je zadán organizationId
     * - ADMIN: Vidí pouze klienty z jeho organizace
     * - COORDINATOR: Vidí pouze klienty z jeho oddělení
     * - CAREGIVER: Vidí pouze klienty z jeho oddělení
     * - CLIENT: Nemá přístup (ošetřeno na úrovni controlleru)
     *
     * @param activeOnly Filtrovat pouze aktivní klienty
     * @param organizationId Volitelné ID organizace pro filtrování (pouze pro SUPERADMIN)
     */
    @Transactional(readOnly = true)
    protected List<ClientDTO> getClientsByRole(boolean activeOnly, Long organizationId) {
        return filterEntitiesByRole(
                () -> activeOnly ? clientRepository.findByActiveTrue() : clientRepository.findAll(),
                orgId -> activeOnly ? clientRepository.findByActiveTrueAndOrganizationId(orgId)
                                    : clientRepository.findByOrganizationId(orgId),
                deptId -> activeOnly ? clientRepository.findByActiveTrueAndDepartmentId(deptId)
                                     : clientRepository.findByDepartmentId(deptId),
                clientMapper::toDTOList,
                organizationId
        );
    }

    /**
     * Vrací aktivní klienty filtrované podle role a organizačního kontextu přihlášeného uživatele.
     *
     * @param organizationId Volitelné ID organizace pro filtrování (pouze pro SUPERADMIN)
     */
    @Transactional(readOnly = true)
    public List<ClientDTO> getAllActiveClients(Long organizationId) {
        return getClientsByRole(true, organizationId);
    }

    /**
     * Vrací všechny klienty (včetně neaktivních) filtrované podle role a organizačního kontextu přihlášeného uživatele.
     *
     * @param organizationId Volitelné ID organizace pro filtrování (pouze pro SUPERADMIN)
     */
    @Transactional(readOnly = true)
    public List<ClientDTO> getAllClients(Long organizationId) {
        return getClientsByRole(false, organizationId);
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

    /**
     * Vrací individuální plán klienta s AKTUÁLNÍ verzí contentu jako DTO.
     * Validuje, že má uživatel přístup ke klientovi.
     *
     * @param clientId ID klienta
     * @return IndividualPlanDTO s aktuální verzí, pokud existuje
     * @throws SecurityException Pokud uživatel nemá přístup ke klientovi
     * @throws RuntimeException Pokud klient nebyl nalezen
     */
    @Transactional(readOnly = true)
    public Optional<IndividualPlanDTO> getClientIndividualPlan(Long clientId) {
        // Validace přístupu
        validateClientAccess(clientId);

        // Vrátit plán s aktuální verzí
        return individualPlanRepository.findByClientId(clientId)
                .map(individualPlanMapper::toDTO);
    }

    /**
     * Vrací seznam verzí individuálního plánu klienta (pouze metadata, bez velkého contentu).
     * Použij pro zobrazení seznamu verzí v UI.
     *
     * @param clientId ID klienta
     * @return Seznam verzí s metadaty (od nejnovější)
     * @throws SecurityException Pokud uživatel nemá přístup ke klientovi
     * @throws RuntimeException Pokud klient nebo plán nebyl nalezen
     */
    @Transactional(readOnly = true)
    public List<IndividualPlanVersionSummaryDTO> getClientIndividualPlanHistory(Long clientId) {
        // Validace přístupu
        validateClientAccess(clientId);

        // Najít plán
        IndividualPlan plan = individualPlanRepository.findByClientId(clientId)
                .orElseThrow(() -> new RuntimeException("Individual plan not found for client"));

        // Vrátit jen metadata verzí (už jsou seřazené @OrderBy("versionNumber DESC"))
        return individualPlanContentMapper.toVersionSummaryList(plan.getContentVersions());
    }

    /**
     * Vrací KONKRÉTNÍ verzi contentu individuálního plánu klienta (s plným contentem).
     * Použij pro zobrazení detailu konkrétní verze.
     *
     * @param clientId ID klienta
     * @param versionNumber Číslo verze (1, 2, 3...)
     * @return Konkrétní verze s plným contentem
     * @throws SecurityException Pokud uživatel nemá přístup ke klientovi
     * @throws RuntimeException Pokud klient, plán nebo verze nebyla nalezena
     */
    @Transactional(readOnly = true)
    public IndividualPlanContentDTO getClientIndividualPlanVersion(Long clientId, Integer versionNumber) {
        // Validace přístupu
        validateClientAccess(clientId);

        // Najít plán
        IndividualPlan plan = individualPlanRepository.findByClientId(clientId)
                .orElseThrow(() -> new RuntimeException("Individual plan not found for client"));

        // Najít konkrétní verzi s plným contentem
        return plan.getContentVersions().stream()
                .filter(content -> content.getVersionNumber().equals(versionNumber))
                .findFirst()
                .map(individualPlanContentMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("Version " + versionNumber + " not found"));
    }

    /**
     * Helper metoda pro validaci přístupu ke klientovi.
     * Vyhodí SecurityException, pokud uživatel nemá přístup.
     */
    private void validateClientAccess(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        validateDepartmentAccess(
                client,
                c -> c.getOrganization().getId(),
                c -> c.getDepartment() != null ? c.getDepartment().getId() : null
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

        // Validace, že všechny entity patří do správné organizace/departmentu
        validateDepartmentAccess(
                department,
                dept -> dept.getOrganization().getId(),
                Department::getId
        );
        validateOrganizationAccess(caregiver, emp -> emp.getOrganization().getId());
        for (Task task : tasks) {
            validateOrganizationAccess(task, t -> t.getOrganization().getId());
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

        // Validace oprávnění
        validateUpdateAccess(
                client,
                c -> c.getOrganization().getId(),
                c -> c.getDepartment() != null ? c.getDepartment().getId() : null
        );

        return saveClient(client, dto);
    }

    public Client terminateClient(Long id, ClientTerminateDTO dto) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        // Validace oprávnění
        validateUpdateAccess(
                client,
                c -> c.getOrganization().getId(),
                c -> c.getDepartment() != null ? c.getDepartment().getId() : null
        );

        client.setActive(false);
        client.setTerminationDate(dto.getTerminationDate());
        client.setTerminationReason(TerminationReason.valueOf(dto.getTerminationReason()));

        return clientRepository.save(client);
    }

    public Client activateClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        // Validace oprávnění
        validateUpdateAccess(
                client,
                c -> c.getOrganization().getId(),
                c -> c.getDepartment() != null ? c.getDepartment().getId() : null
        );

        client.setActive(true);
        client.setTerminationDate(null);
        client.setTerminationReason(null);

        return clientRepository.save(client);
    }

    /**
     * Validuje, že uživatel má oprávnění upravovat individuální plán klienta.
     * Oprávnění má:
     * - SUPERADMIN (vždy)
     * - ADMIN ze stejné organizace
     * - CAREGIVER přiřazený ke klientovi
     *
     * @param client Klient, jehož individuální plán se má upravovat
     * @throws SecurityException Pokud uživatel nemá oprávnění
     */
    private void validateIndividualPlanUpdateAccess(Client client) {
        User user = getCurrentUser();
        UserRole role = user.getRole();

        // SUPERADMIN má přístup ke všemu
        if (role == UserRole.SUPERADMIN) {
            return;
        }

        // Zaměstnanci musí mít přiřazenou organizaci
        if (user.getEmployee() == null || user.getEmployee().getOrganization() == null) {
            throw new SecurityException("Employee must have an associated organization");
        }

        Long userOrgId = user.getEmployee().getOrganization().getId();
        Long clientOrgId = client.getOrganization().getId();

        // Kontrola, že uživatel je ze stejné organizace jako klient
        if (!userOrgId.equals(clientOrgId)) {
            throw new SecurityException("Access denied: Client is from a different organization");
        }

        // ADMIN má přístup ke všem klientům ve své organizaci
        if (role == UserRole.ADMIN) {
            return;
        }

        // CAREGIVER a COORDINATOR mohou upravovat pouze individuální plány klientů, ke kterým jsou přiřazeni
        if (role == UserRole.CAREGIVER || role == UserRole.COORDINATOR) {
            Long assignedCaregiverId = client.getCaregiver().getId();
            Long currentEmployeeId = user.getEmployee().getId();

            if (!assignedCaregiverId.equals(currentEmployeeId)) {
                throw new SecurityException("Employee can only modify individual plans for their assigned clients");
            }
            return;
        }

        // Jiné role nemají oprávnění upravovat individuální plány
        throw new SecurityException("User does not have permission to modify individual plans");
    }

    /**
     * Helper metoda pro mapování dat z DTO do IndividualPlanContent entity.
     * Používá se jak při vytváření první verze, tak při vytváření nových verzí.
     */
    private void mapContentFields(IndividualPlanContent content, IndividualPlanContentRequestDTO dto) {
        content.setProcessedDate(dto.getProcessedDate());
        content.setPlannedUpdateDate(dto.getPlannedUpdateDate());

        // Osobní údaje
        content.setLikes(dto.getLikes());
        content.setDislikes(dto.getDislikes());
        content.setStrengths(dto.getStrengths());
        content.setAspirations(dto.getAspirations());
        content.setLifePath(dto.getLifePath());
        content.setAdditionalInfo(dto.getAdditionalInfo());

        // Oblasti péče
        content.setHygiene(dto.getHygiene());
        content.setSelfCare(dto.getSelfCare());
        content.setMobility(dto.getMobility());
        content.setDiet(dto.getDiet());
        content.setHomeCare(dto.getHomeCare());
        content.setSocialContact(dto.getSocialContact());
        content.setActivities(dto.getActivities());
        content.setHealth(dto.getHealth());
        content.setExercisingRights(dto.getExercisingRights());
    }

    /**
     * Vytvoří PRVNÍ individuální plán pro klienta.
     * Pokud klient už plán má, vyhodí výjimku.
     *
     * @param clientId ID klienta
     * @param contentDTO Data pro první verzi plánu
     * @return Vytvořený plán jako DTO
     * @throws SecurityException Pokud uživatel nemá přístup ke klientovi
     * @throws RuntimeException Pokud klient nebyl nalezen nebo už má plán
     */
    @Transactional
    public IndividualPlanDTO createIndividualPlan(Long clientId, IndividualPlanContentRequestDTO contentDTO) {
        // Validace přístupu
        validateClientAccess(clientId);

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        // Kontrola, že klient ještě nemá plán
        if (individualPlanRepository.findByClientId(clientId).isPresent()) {
            throw new RuntimeException("Individual plan already exists for this client");
        }

        // Validace oprávnění pro úpravu individuálního plánu
        validateIndividualPlanUpdateAccess(client);

        // Vytvořit hlavní IndividualPlan
        IndividualPlan plan = new IndividualPlan();
        plan.setClient(client);
        plan.setOrganization(client.getOrganization());

        // Vytvořit PRVNÍ verzi contentu
        IndividualPlanContent firstVersion = new IndividualPlanContent();
        firstVersion.setIndividualPlan(plan);
        firstVersion.setVersionNumber(1);
        mapContentFields(firstVersion, contentDTO);

        // Nastavit první verzi jako aktuální
        plan.setCurrentContent(firstVersion);
        plan.setContentVersions(new ArrayList<>(List.of(firstVersion)));

        // Uložit vše
        IndividualPlan savedPlan = individualPlanRepository.save(plan);

        return individualPlanMapper.toDTO(savedPlan);
    }

    /**
     * Vytvoří NOVOU verzi individuálního plánu pro klienta.
     * Původní verze zůstávají zachované jako historie.
     *
     * @param clientId ID klienta
     * @param contentDTO Data pro novou verzi plánu
     * @return Aktualizovaný plán jako DTO
     * @throws SecurityException Pokud uživatel nemá přístup ke klientovi
     * @throws RuntimeException Pokud klient nebo plán nebyl nalezen
     */
    @Transactional
    public IndividualPlanDTO updateIndividualPlan(Long clientId, IndividualPlanContentRequestDTO contentDTO) {
        // Validace přístupu
        validateClientAccess(clientId);

        // Najít existující plán
        IndividualPlan plan = individualPlanRepository.findByClientId(clientId)
                .orElseThrow(() -> new RuntimeException("Individual plan not found for client"));

        // Validace oprávnění pro úpravu individuálního plánu
        validateIndividualPlanUpdateAccess(plan.getClient());

        // Získat nejvyšší číslo verze
        Integer maxVersion = plan.getContentVersions().stream()
                .map(IndividualPlanContent::getVersionNumber)
                .max(Integer::compareTo)
                .orElse(0);

        // Vytvořit NOVOU verzi contentu
        IndividualPlanContent newVersion = new IndividualPlanContent();
        newVersion.setIndividualPlan(plan);
        newVersion.setVersionNumber(maxVersion + 1);
        mapContentFields(newVersion, contentDTO);

        // Aktualizovat currentContent na novou verzi
        plan.setCurrentContent(newVersion);
        plan.getContentVersions().add(newVersion);

        // Uložit změny
        IndividualPlan savedPlan = individualPlanRepository.save(plan);

        return individualPlanMapper.toDTO(savedPlan);
    }

    /**
     * Vytvoří a přidá nový daily record k individuálnímu plánu klienta.
     * Neovlivňuje verzování - daily records jsou globální pro celý plán.
     *
     * @param clientId ID klienta
     * @param dailyRecordDTO Data pro vytvoření daily record
     * @return Aktualizovaný plán jako DTO
     * @throws SecurityException Pokud uživatel nemá přístup ke klientovi
     * @throws RuntimeException Pokud klient nebo plán nebyl nalezen
     */
    @Transactional
    public IndividualPlanDTO addDailyRecordToIndividualPlan(Long clientId, DailyRecordRequestDTO dailyRecordDTO) {
        // Validace přístupu
        validateClientAccess(clientId);

        // Najít plán
        IndividualPlan plan = individualPlanRepository.findByClientId(clientId)
                .orElseThrow(() -> new RuntimeException("Individual plan not found for client"));

        // Validace oprávnění pro update (ADMIN v organizaci, COORDINATOR/CAREGIVER v departmentu)
        validateUpdateAccess(
                plan.getClient(),
                c -> c.getOrganization().getId(),
                c -> c.getDepartment() != null ? c.getDepartment().getId() : null
        );

        // Vytvořit nový daily record
        DailyRecord dailyRecord = new DailyRecord();
        dailyRecord.setDate(dailyRecordDTO.getDate());
        dailyRecord.setContent(dailyRecordDTO.getContent());
        dailyRecord.setCreatedBy(getCurrentUser().getEmployee());
        dailyRecord.setIndividualPlan(plan);

        // Uložit daily record
        DailyRecord savedDailyRecord = dailyRecordRepository.save(dailyRecord);

        // Inicializovat seznam, pokud je null
        if (plan.getDailyRecords() == null) {
            plan.setDailyRecords(new ArrayList<>());
        }

        // Přidat daily record
        plan.getDailyRecords().add(savedDailyRecord);

        // Uložit změny
        IndividualPlan savedPlan = individualPlanRepository.save(plan);

        return individualPlanMapper.toDTO(savedPlan);
    }

    /**
     * Odebere daily record z individuálního plánu klienta.
     * Neovlivňuje verzování - daily records jsou globální pro celý plán.
     *
     * @param clientId ID klienta
     * @param dailyRecordId ID daily record k odebrání
     * @return Aktualizovaný plán jako DTO
     * @throws SecurityException Pokud uživatel nemá přístup ke klientovi
     * @throws RuntimeException Pokud klient nebo plán nebyl nalezen
     */
    @Transactional
    public IndividualPlanDTO removeDailyRecordFromIndividualPlan(Long clientId, Long dailyRecordId) {
        // Validace přístupu
        validateClientAccess(clientId);

        // Najít plán
        IndividualPlan plan = individualPlanRepository.findByClientId(clientId)
                .orElseThrow(() -> new RuntimeException("Individual plan not found for client"));

        // Validace oprávnění pro update (ADMIN v organizaci, COORDINATOR/CAREGIVER v departmentu)
        validateUpdateAccess(
                plan.getClient(),
                c -> c.getOrganization().getId(),
                c -> c.getDepartment() != null ? c.getDepartment().getId() : null
        );

        // Odebrat daily record
        if (plan.getDailyRecords() != null) {
            plan.getDailyRecords().removeIf(dr -> dr.getId().equals(dailyRecordId));
        }

        // Uložit změny
        IndividualPlan savedPlan = individualPlanRepository.save(plan);

        return individualPlanMapper.toDTO(savedPlan);
    }
}
