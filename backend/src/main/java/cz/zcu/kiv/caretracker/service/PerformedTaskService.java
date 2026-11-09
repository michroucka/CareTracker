package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.performedTask.PerformedTaskDTO;
import cz.zcu.kiv.caretracker.dto.performedTask.PerformedTaskRequestDTO;
import cz.zcu.kiv.caretracker.dto.performedTask.PerformedTaskSummaryDTO;
import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.enums.UnitType;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.exception.ValidationException;
import cz.zcu.kiv.caretracker.mapper.PerformedTaskMapper;
import cz.zcu.kiv.caretracker.repository.*;
import cz.zcu.kiv.caretracker.specification.PerformedTaskSpecifications;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PerformedTaskService extends BaseRoleFilteringService<PerformedTask, PerformedTaskDTO> {

    @Autowired
    private PerformedTaskRepository performedTaskRepository;
    @Autowired
    private PerformedTaskMapper performedTaskMapper;
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private EmployeeRepository employeeRepository;
    @Autowired
    private Clock clock;

    /**
     * Returns performed tasks filtered by the current user's role and the supplied optional criteria.
     * <p>
     * SUPERADMIN: may filter by {@code organizationId}, {@code departmentIds}, {@code caregiverIds}, {@code clientId}.<br>
     * ADMIN: scoped to own organization.<br>
     * COORDINATOR/CAREGIVER: scoped to own department.<br>
     * CLIENT: always sees only their own tasks; {@code clientId} parameter is ignored.
     *
     * @param organizationId optional organization filter (SUPERADMIN only)
     * @param departmentIds optional department filter
     * @param caregiverIds optional caregiver filter
     * @param clientId optional client filter (ignored for CLIENT role)
     * @param month optional month filter (1–12)
     * @param year optional year filter
     * @return role-filtered list of performed task summary DTOs
     */
    @Transactional(readOnly = true)
    public List<PerformedTaskSummaryDTO> getPerformedTasks(Long organizationId, List<Long> departmentIds, List<Long> caregiverIds, Long clientId, Integer month, Integer year) {
        User currentUser = getCurrentUser();

        // CLIENT role bypasses org/dept filters — always scoped to the client's own records
        if (currentUser.getRole() == UserRole.CLIENT) {
            if (currentUser.getClient() == null) {
                return Collections.emptyList();
            }
            Long ownClientId = currentUser.getClient().getId();
            Specification<PerformedTask> spec = PerformedTaskSpecifications.withFilters(
                    null, null, null, ownClientId, month, year
            );
            List<PerformedTask> performedTasks = performedTaskRepository.findAll(spec);
            return performedTaskMapper.toSummaryDTOList(performedTasks);
        }

        RoleBasedFilters roleFilters = calculateRoleBasedFilters(organizationId, departmentIds);

        if (roleFilters.isNoAccess()) {
            return Collections.emptyList();
        }

        Specification<PerformedTask> spec = PerformedTaskSpecifications.withFilters(
                roleFilters.getOrganizationId(),
                roleFilters.getDepartmentIds(),
                caregiverIds,
                clientId,
                month, year
        );

        List<PerformedTask> performedTasks = performedTaskRepository.findAll(spec);
        return performedTaskMapper.toSummaryDTOList(performedTasks);
    }

    /**
     * Returns a single performed task by ID, applying role-based access control.
     * CLIENT role may only access tasks belonging to their own client record.
     *
     * @param id the performed task ID
     * @return the task DTO, or empty if not found or the user lacks access
     */
    @Transactional(readOnly = true)
    public Optional<PerformedTaskDTO> getPerformedTaskById(Long id) {
        Optional<PerformedTask> taskOpt = performedTaskRepository.findById(id);
        if (taskOpt.isEmpty()) {
            return Optional.empty();
        }

        PerformedTask performedTask = taskOpt.get();
        User user = getCurrentUser();

        if (user.getRole() == UserRole.CLIENT) {
            if (user.getClient() == null || !user.getClient().getId().equals(performedTask.getClient().getId())) {
                throw new SecurityException("Nemáte oprávnění zobrazit tento úkol");
            }
            return Optional.of(performedTaskMapper.toDTO(performedTask));
        }

        return getEntityByIdWithPermissionCheck(
                id,
                () -> taskOpt,
                pt -> pt.getOrganization().getId(),
                pt -> pt.getDepartment().getId(),
                performedTaskMapper::toDTO
        );
    }

    /**
     * Persists a performed task entity from the supplied DTO, resolving all related entities
     * and validating that they belong to the current user's organization/department.
     */
    private PerformedTask savePerformedTask(PerformedTask performedTask, PerformedTaskRequestDTO dto) {
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Klient nebyl nalezen"));
        Task task = taskRepository.findById(dto.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Úkol nebyl nalezen"));
        if (dto.getCaregiverIds() == null || dto.getCaregiverIds().isEmpty()) {
            throw new ValidationException("Úkon musí mít alespoň jednoho pečovatele");
        }
        List<Employee> caregivers = new ArrayList<>();
        for (Long employeeId : dto.getCaregiverIds()) {
            Employee caregiver = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Zaměstnanec nebyl nalezen"));
            caregivers.add(caregiver);
        }

        validateDepartmentAccess(
                client,
                c -> c.getOrganization().getId(),
                c -> c.getDepartment() != null ? c.getDepartment().getId() : null
        );
        validateOrganizationAccess(task, t -> t.getOrganization().getId());
        for (Employee caregiver : caregivers) {
            validateOrganizationAccess(caregiver, emp -> emp.getOrganization().getId());
        }
        validateCaregivers(performedTask, client, caregivers);
        validateTask(performedTask, task);
        validateAmount(dto.getUnitCount(), task);
        validateDate(dto.getDate());

        performedTaskMapper.requestToPerformedTask(performedTask, dto, client, task, caregivers);
        return performedTaskRepository.save(performedTask);
    }

    /**
     * Creates a new performed task record.
     *
     * @param dto the performed task data
     * @return the persisted entity
     */
    public PerformedTask createPerformedTask(PerformedTaskRequestDTO dto) {
        PerformedTask performedTask = new PerformedTask();
        return savePerformedTask(performedTask, dto);
    }

    /**
     * Updates an existing performed task, applying role-based write access and caregiver assignment validation.
     *
     * @param id the performed task ID
     * @param dto updated task data
     * @return the updated entity
     */
    public PerformedTask updatePerformedTask(Long id, PerformedTaskRequestDTO dto) {
        PerformedTask task = performedTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Provedený úkon nebyl nalezen"));

        validateUpdateAccess(
                task,
                pt -> pt.getOrganization().getId(),
                pt -> pt.getDepartment() != null ? pt.getDepartment().getId() : null
        );

        validateCaregiverAssignment(task);

        return savePerformedTask(task, dto);
    }

    /**
     * Deletes a performed task, applying role-based write access and caregiver assignment validation.
     *
     * @param id the performed task ID to delete
     */
    public void deletePerformedTask(Long id) {
        PerformedTask task = performedTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Provedený úkon nebyl nalezen"));

        validateUpdateAccess(
                task,
                pt -> pt.getOrganization().getId(),
                pt -> pt.getDepartment() != null ? pt.getDepartment().getId() : null
        );

        validateCaregiverAssignment(task);

        performedTaskRepository.delete(task);
    }

    /**
     * Newly added caregivers must work in the client's department (caregivers already on the record may have
     * moved since). A CAREGIVER must list themselves, otherwise they could not edit the record afterwards.
     *
     * @throws ValidationException if a caregiver is from another department or a CAREGIVER left themselves out
     */
    private void validateCaregivers(PerformedTask performedTask, Client client, List<Employee> caregivers) {
        Set<Long> currentCaregiverIds = performedTask.getCaregivers() == null ? Set.of()
                : performedTask.getCaregivers().stream().map(Employee::getId).collect(Collectors.toSet());
        for (Employee caregiver : caregivers) {
            boolean newlyAdded = !currentCaregiverIds.contains(caregiver.getId());
            if (newlyAdded && !caregiver.getDepartment().getId().equals(client.getDepartment().getId())) {
                throw new ValidationException("Pečovatel musí patřit do střediska klienta");
            }
        }

        User currentUser = getCurrentUser();
        if (currentUser.getRole() == UserRole.CAREGIVER
                && caregivers.stream().noneMatch(c -> c.getId().equals(currentUser.getEmployee().getId()))) {
            throw new ValidationException("Mezi pečovateli musíte být i vy");
        }
    }

    /** A deactivated task stays on the records it already has, so they remain editable. */
    private void validateTask(PerformedTask performedTask, Task task) {
        boolean keepsCurrentTask = performedTask.getTask() != null && performedTask.getTask().getId().equals(task.getId());
        if (!task.getActive() && !keepsCurrentTask) {
            throw new ValidationException("Deaktivovaný úkon nelze zapsat");
        }
    }

    private void validateDate(LocalDateTime date) {
        if (date == null) {
            throw new ValidationException("Datum úkonu je povinné");
        }
        if (date.isAfter(LocalDateTime.now(clock))) {
            throw new ValidationException("Úkon nemůže být v budoucnosti");
        }
    }

    private void validateAmount(Double unitCount, Task task) {
        if (unitCount == null) {
            throw new ValidationException("Množství je povinné");
        }
        if (unitCount <= 0) {
            throw new ValidationException("Množství musí být větší než 0");
        }
        if (task.getUnitType() == UnitType.OCCURRENCE && unitCount % 1 != 0) {
            throw new ValidationException("Počet úkonů musí být celé číslo");
        }
    }

    /**
     * For CAREGIVER role, ensures they are listed as one of the task's caregivers before allowing a mutation.
     * Other roles pass through unconditionally.
     *
     * @throws SecurityException if a CAREGIVER is not assigned to this task
     */
    private void validateCaregiverAssignment(PerformedTask task) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.CAREGIVER) return;

        Long employeeId = currentUser.getEmployee().getId();
        boolean isAssigned = task.getCaregivers().stream()
                .anyMatch(c -> c.getId().equals(employeeId));
        if (!isAssigned) {
            throw new SecurityException("Nemáte oprávnění upravovat tento úkon");
        }
    }
}
