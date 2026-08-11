package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.client.ClientDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientRequestDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientShortDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientTerminateDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.DailyRecordRequestDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanContentDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanContentRequestDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanVersionSummaryDTO;
import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.enums.TerminationReason;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.exception.ValidationException;
import cz.zcu.kiv.caretracker.mapper.ClientMapper;
import cz.zcu.kiv.caretracker.repository.*;
import cz.zcu.kiv.caretracker.specification.ClientSpecifications;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

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
    @Autowired
    private GeocodingService geocodingService;

    /**
     * Returns clients filtered by the current user's role and the supplied optional criteria.
     * Uses JPA Specifications for efficient database-level filtering.
     * <p>
     * SUPERADMIN: may filter by {@code organizationId}, {@code status}, {@code departmentIds}, {@code caregiverIds}.<br>
     * ADMIN: scoped to own organization; may filter by {@code status}, {@code departmentIds}, {@code caregiverIds}.<br>
     * COORDINATOR: scoped to own department; may filter by {@code status} and {@code caregiverIds}.<br>
     * CAREGIVER: scoped to own department, active clients only; may filter by {@code caregiverIds}.
     *
     * @param organizationId optional organization filter (SUPERADMIN only)
     * @param status {@code true} = active, {@code false} = inactive, {@code null} = all (CAREGIVER always sees active)
     * @param departmentIds optional department filter
     * @param caregiverIds optional caregiver filter
     * @return role-filtered list of client short DTOs
     */
    @Transactional(readOnly = true)
    public List<ClientShortDTO> getClients(Long organizationId, Boolean status, List<Long> departmentIds, List<Long> caregiverIds) {
        RoleBasedFilters roleFilters = calculateRoleBasedFilters(organizationId, departmentIds);

        if (roleFilters.isNoAccess()) {
            return Collections.emptyList();
        }

        Specification<Client> spec = ClientSpecifications.withFilters(
                roleFilters.getOrganizationId(),
                status,
                roleFilters.getDepartmentIds(),
                caregiverIds
        );

        List<Client> clients = clientRepository.findAll(spec);
        return clientMapper.toShortDTOList(clients);
    }

    /**
     * Returns a single client by ID, applying role-based department-level access control.
     *
     * @param id the client ID
     * @return the client DTO, or empty if not found or the user lacks access
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
     * Returns the individual care plan for a client, including the current content version.
     *
     * @param clientId the client ID
     * @return the plan DTO, or empty if no plan exists
     * @throws SecurityException if the user does not have access to this client
     * @throws ResourceNotFoundException if the client is not found
     */
    @Transactional(readOnly = true)
    public Optional<IndividualPlanDTO> getClientIndividualPlan(Long clientId) {
        validateClientAccess(clientId);
        return individualPlanRepository.findByClientId(clientId)
                .map(individualPlanMapper::toDTO);
    }

    /**
     * Returns version summary metadata for a client's individual plan, ordered newest first.
     * Does not include the full content of each version.
     *
     * @param clientId the client ID
     * @return list of version summaries
     * @throws SecurityException if the user does not have access to this client
     * @throws ResourceNotFoundException if the client or plan is not found
     */
    @Transactional(readOnly = true)
    public List<IndividualPlanVersionSummaryDTO> getClientIndividualPlanHistory(Long clientId) {
        validateClientAccess(clientId);
        IndividualPlan plan = individualPlanRepository.findByClientId(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Individuální plán klienta nebyl nalezen"));
        // ordered by @OrderBy("versionNumber DESC") on the collection mapping
        return individualPlanContentMapper.toVersionSummaryList(plan.getContentVersions());
    }

    /**
     * Returns a specific version of a client's individual plan, including full content.
     *
     * @param clientId the client ID
     * @param versionNumber the version number (1-based)
     * @return the plan content DTO for the requested version
     * @throws SecurityException if the user does not have access to this client
     * @throws ResourceNotFoundException if the client, plan, or version is not found
     */
    @Transactional(readOnly = true)
    public IndividualPlanContentDTO getClientIndividualPlanVersion(Long clientId, Integer versionNumber) {
        validateClientAccess(clientId);
        IndividualPlan plan = individualPlanRepository.findByClientId(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Individuální plán klienta nebyl nalezen"));
        return plan.getContentVersions().stream()
                .filter(content -> content.getVersionNumber().equals(versionNumber))
                .findFirst()
                .map(individualPlanContentMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Verze " + versionNumber + " nebyla nalezena"));
    }

    /**
     * Verifies that the current user has access to the given client.
     *
     * @throws ResourceNotFoundException if the client does not exist
     * @throws SecurityException if the user does not have access to this client's department
     */
    private void validateClientAccess(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Klient nebyl nalezen"));

        validateDepartmentAccess(
                client,
                c -> c.getOrganization().getId(),
                c -> c.getDepartment() != null ? c.getDepartment().getId() : null
        );
    }

    /**
     * Persists a client entity from the supplied DTO, resolving all related entities and validating
     * that they belong to the current user's organization/department.
     * When no personalNumber is provided, the entity is saved first so the generated ID is available,
     * then incremented until a unique number within the organization is found.
     */
    private Client saveClient(Client client, ClientRequestDTO dto) {
        Department department = departmentRepository.findById(dto.getDepartmentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Oddělení nebylo nalezeno"));
        Employee caregiver = employeeRepository.findById(dto.getCaregiverId())
                        .orElseThrow(() -> new ResourceNotFoundException("Zaměstnanec nebyl nalezen"));
        List<Task> tasks = new ArrayList<>();
        for (Long taskId : dto.getTaskIds()) {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new ResourceNotFoundException("Úkol nebyl nalezen"));
            tasks.add(task);
        }

        validateDepartmentAccess(
                department,
                dept -> dept.getOrganization().getId(),
                Department::getId
        );
        validateOrganizationAccess(caregiver, emp -> emp.getOrganization().getId());
        for (Task task : tasks) {
            validateOrganizationAccess(task, t -> t.getOrganization().getId());
        }

        boolean addressChanged = !Objects.equals(client.getStreet(), dto.getStreet())
                || !Objects.equals(client.getCity(), dto.getCity())
                || !Objects.equals(client.getPostalCode(), dto.getPostalCode());

        clientMapper.requestToClient(client, dto, department, caregiver, tasks);

        if (addressChanged) {
            Optional<GeocodingService.GeocodeResult> result = geocodingService.geocode(client.getStreet(), client.getCity(), client.getPostalCode());
            client.setLatitude(result.map(GeocodingService.GeocodeResult::latitude).orElse(null));
            client.setLongitude(result.map(GeocodingService.GeocodeResult::longitude).orElse(null));
        }

        if (dto.getPersonalNumber() != null) {
            client.setPersonalNumber(dto.getPersonalNumber());
        } else if (client.getPersonalNumber() == null) {
            // Save first to get the generated ID, then find the next free personal number starting from it.
            Client savedClient = clientRepository.save(client);
            Long organizationId = savedClient.getOrganization().getId();
            Long personalNumber = savedClient.getId();
            while (clientRepository.existsByPersonalNumberAndOrganizationIdAndActiveTrue(personalNumber, organizationId)) {
                personalNumber++;
            }
            savedClient.setPersonalNumber(personalNumber);
            return clientRepository.save(savedClient);
        }

        return clientRepository.save(client);
    }

    /**
     * Creates a new client from the supplied request DTO.
     *
     * @param dto the client creation data
     * @return the persisted client entity
     */
    public Client createClient(ClientRequestDTO dto) {
        Client client = new Client();
        return saveClient(client, dto);
    }

    /**
     * Updates an existing client, applying role-based write access validation.
     *
     * @param id the client ID
     * @param dto updated client data
     * @return the updated client entity
     * @throws ResourceNotFoundException if the client does not exist
     * @throws SecurityException if the user does not have write access
     */
    public Client updateClient(Long id, ClientRequestDTO dto) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Klient nebyl nalezen"));
        validateUpdateAccess(
                client,
                c -> c.getOrganization().getId(),
                c -> c.getDepartment() != null ? c.getDepartment().getId() : null
        );
        return saveClient(client, dto);
    }

    /**
     * Deactivates a client and records the termination reason and date.
     *
     * @param id the client ID
     * @param dto termination details
     * @return the updated client entity
     */
    public Client terminateClient(Long id, ClientTerminateDTO dto) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Klient nebyl nalezen"));
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

    /**
     * Re-activates a previously terminated client, clearing the termination fields.
     *
     * @param id the client ID
     * @return the updated client entity
     */
    public Client activateClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Klient nebyl nalezen"));
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
     * Validates that the current user may modify a client's individual plan.
     * SUPERADMIN and ADMIN (same organization) have full access;
     * COORDINATOR and CAREGIVER may only edit plans for clients directly assigned to them.
     *
     * @param client the client whose plan is being modified
     * @throws SecurityException if the user does not have write access to this plan
     */
    private void validateIndividualPlanUpdateAccess(Client client) {
        User user = getCurrentUser();
        UserRole role = user.getRole();

        if (role == UserRole.SUPERADMIN) {
            return;
        }

        if (user.getEmployee() == null || user.getEmployee().getOrganization() == null) {
            throw new SecurityException("Zaměstnanec musí mít přiřazenou organizaci");
        }

        Long userOrgId = user.getEmployee().getOrganization().getId();
        Long clientOrgId = client.getOrganization().getId();

        if (!userOrgId.equals(clientOrgId)) {
            throw new SecurityException("Přístup odepřen: Klient je z jiné organizace");
        }

        if (role == UserRole.ADMIN) {
            return;
        }

        // CAREGIVER and COORDINATOR may only edit plans for their directly assigned clients
        if (role == UserRole.CAREGIVER || role == UserRole.COORDINATOR) {
            Long assignedCaregiverId = client.getCaregiver().getId();
            Long currentEmployeeId = user.getEmployee().getId();
            if (!assignedCaregiverId.equals(currentEmployeeId)) {
                throw new SecurityException("Zaměstnanec smí upravovat individuální plán pouze svým klientům");
            }
            return;
        }

        throw new SecurityException("Uživatel nemá přístup k úpravě individuálního plánu");
    }

    /**
     * Maps all content fields from the request DTO onto an {@link IndividualPlanContent} entity.
     * Used for both initial creation and subsequent version updates.
     */
    private void mapContentFields(IndividualPlanContent content, IndividualPlanContentRequestDTO dto) {
        content.setProcessedDate(dto.getProcessedDate());
        content.setPlannedUpdateDate(dto.getPlannedUpdateDate());
        content.setLikes(dto.getLikes());
        content.setDislikes(dto.getDislikes());
        content.setStrengths(dto.getStrengths());
        content.setAspirations(dto.getAspirations());
        content.setLifePath(dto.getLifePath());
        content.setAdditionalInfo(dto.getAdditionalInfo());
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
     * Creates the first individual care plan for a client.
     * Throws if the client already has a plan.
     *
     * @param clientId the client ID
     * @param contentDTO content for the initial plan version
     * @return the created plan DTO
     * @throws SecurityException if the user does not have access to this client
     * @throws ValidationException if the client already has an individual plan
     * @throws ResourceNotFoundException if the client is not found
     */
    @Transactional
    public IndividualPlanDTO createIndividualPlan(Long clientId, IndividualPlanContentRequestDTO contentDTO) {
        validateClientAccess(clientId);

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Klient nebyl nalezen"));

        if (individualPlanRepository.findByClientId(clientId).isPresent()) {
            throw new ValidationException("Individuální plán pro tohoto klienta již existuje");
        }

        validateIndividualPlanUpdateAccess(client);

        IndividualPlan plan = new IndividualPlan();
        plan.setClient(client);
        plan.setOrganization(client.getOrganization());

        IndividualPlanContent firstVersion = new IndividualPlanContent();
        firstVersion.setIndividualPlan(plan);
        firstVersion.setVersionNumber(1);
        mapContentFields(firstVersion, contentDTO);

        plan.setCurrentContent(firstVersion);
        plan.setContentVersions(new ArrayList<>(List.of(firstVersion)));

        IndividualPlan savedPlan = individualPlanRepository.save(plan);
        return individualPlanMapper.toDTO(savedPlan);
    }

    /**
     * Appends a new version to a client's individual care plan.
     * Previous versions are retained as history and remain accessible by version number.
     *
     * @param clientId the client ID
     * @param contentDTO content for the new plan version
     * @return the updated plan DTO (reflecting the new current version)
     * @throws SecurityException if the user does not have access to this client
     * @throws ResourceNotFoundException if the client or plan is not found
     */
    @Transactional
    public IndividualPlanDTO updateIndividualPlan(Long clientId, IndividualPlanContentRequestDTO contentDTO) {
        validateClientAccess(clientId);

        IndividualPlan plan = individualPlanRepository.findByClientId(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Individuální plán klienta nebyl nalezen"));

        validateIndividualPlanUpdateAccess(plan.getClient());

        Integer maxVersion = plan.getContentVersions().stream()
                .map(IndividualPlanContent::getVersionNumber)
                .max(Integer::compareTo)
                .orElse(0);

        IndividualPlanContent newVersion = new IndividualPlanContent();
        newVersion.setIndividualPlan(plan);
        newVersion.setVersionNumber(maxVersion + 1);
        mapContentFields(newVersion, contentDTO);

        plan.setCurrentContent(newVersion);
        plan.getContentVersions().add(newVersion);

        IndividualPlan savedPlan = individualPlanRepository.save(plan);
        return individualPlanMapper.toDTO(savedPlan);
    }

    /**
     * Adds a daily record to a client's individual care plan.
     * Daily records are not versioned — they are shared across all plan versions.
     *
     * @param clientId the client ID
     * @param dailyRecordDTO the daily record data
     * @return the updated plan DTO
     * @throws SecurityException if the user does not have access or is not an employee
     * @throws ResourceNotFoundException if the client or plan is not found
     */
    @Transactional
    public IndividualPlanDTO addDailyRecordToIndividualPlan(Long clientId, DailyRecordRequestDTO dailyRecordDTO) {
        validateClientAccess(clientId);

        IndividualPlan plan = individualPlanRepository.findByClientId(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Individuální plán klienta nebyl nalezen"));

        validateUpdateAccess(
                plan.getClient(),
                c -> c.getOrganization().getId(),
                c -> c.getDepartment() != null ? c.getDepartment().getId() : null
        );

        Employee currentEmployee = getCurrentUser().getEmployee();
        if (currentEmployee == null) {
            throw new SecurityException("Pouze zaměstnanci mohou vytvářet záznamy do individuálního plánu");
        }

        DailyRecord dailyRecord = new DailyRecord();
        dailyRecord.setDate(dailyRecordDTO.getDate());
        dailyRecord.setContent(dailyRecordDTO.getContent());
        dailyRecord.setCreatedBy(currentEmployee);
        dailyRecord.setIndividualPlan(plan);

        DailyRecord savedDailyRecord = dailyRecordRepository.save(dailyRecord);

        if (plan.getDailyRecords() == null) {
            plan.setDailyRecords(new ArrayList<>());
        }
        plan.getDailyRecords().add(savedDailyRecord);

        IndividualPlan savedPlan = individualPlanRepository.save(plan);
        return individualPlanMapper.toDTO(savedPlan);
    }

    /**
     * Removes a daily record from a client's individual care plan.
     * Daily records are not versioned — the removal affects all plan versions.
     *
     * @param clientId the client ID
     * @param dailyRecordId the ID of the daily record to remove
     * @return the updated plan DTO
     * @throws SecurityException if the user does not have access to this client
     * @throws ResourceNotFoundException if the client or plan is not found
     */
    @Transactional
    public IndividualPlanDTO removeDailyRecordFromIndividualPlan(Long clientId, Long dailyRecordId) {
        validateClientAccess(clientId);

        IndividualPlan plan = individualPlanRepository.findByClientId(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Individuální plán klienta nebyl nalezen"));

        validateUpdateAccess(
                plan.getClient(),
                c -> c.getOrganization().getId(),
                c -> c.getDepartment() != null ? c.getDepartment().getId() : null
        );

        if (plan.getDailyRecords() != null) {
            plan.getDailyRecords().removeIf(dr -> dr.getId().equals(dailyRecordId));
        }

        IndividualPlan savedPlan = individualPlanRepository.save(plan);
        return individualPlanMapper.toDTO(savedPlan);
    }
}
