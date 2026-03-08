package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.performedTask.PerformedTaskDTO;
import cz.zcu.kiv.caretracker.dto.performedTask.PerformedTaskRequestDTO;
import cz.zcu.kiv.caretracker.dto.performedTask.PerformedTaskSummaryDTO;
import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.mapper.PerformedTaskMapper;
import cz.zcu.kiv.caretracker.repository.*;
import cz.zcu.kiv.caretracker.specification.PerformedTaskSpecifications;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

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

    /**
     * Vrací všechny provedené úkony filtrované podle role a organizačního kontextu přihlášeného uživatele.
     * - SUPERADMIN: Vidí všechny úkony, nebo úkony z konkrétní organizace pokud je zadán organizationId
     * - ADMIN: Vidí pouze úkony z jeho organizace
     * - COORDINATOR: Vidí pouze úkony z jeho oddělení
     * - CAREGIVER: Vidí pouze úkony z jeho oddělení
     * - CLIENT: Vidí pouze svoje úkony (clientId z session, parametr clientId je ignorován)
     *
     * @param organizationId Volitelné ID organizace pro filtrování (pouze pro SUPERADMIN)
     * @param clientId       Volitelné ID klienta pro filtrování; pro CLIENT roli vždy přepsáno vlastním ID
     */
    @Transactional(readOnly = true)
    public List<PerformedTaskSummaryDTO> getPerformedTasks(Long organizationId, List<Long> departmentIds, List<Long> caregiverIds, Long clientId, Integer month, Integer year) {
        User currentUser = getCurrentUser();

        // CLIENT vidí pouze svoje úkony – role-based org filtry se přeskočí
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

    private PerformedTask savePerformedTask(PerformedTask performedTask, PerformedTaskRequestDTO dto) {
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Klient nebyl nalezen"));
        Task task = taskRepository.findById(dto.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Úkol nebyl nalezen"));
        List<Employee> caregivers = new ArrayList<>();
        for (Long employeeId : dto.getCaregiverIds()) {
            Employee caregiver = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Zaměstnanec nebyl nalezen"));

            caregivers.add(caregiver);
        }

        // Validace, že všechny entity patří do správné organizace/departmentu
        validateDepartmentAccess(
                client,
                c -> c.getOrganization().getId(),
                c -> c.getDepartment() != null ? c.getDepartment().getId() : null
        );
        validateOrganizationAccess(task, t -> t.getOrganization().getId());
        for (Employee caregiver : caregivers) {
            validateOrganizationAccess(caregiver, emp -> emp.getOrganization().getId());
        }

        performedTaskMapper.requestToPerformedTask(performedTask, dto, client, task, caregivers);

        return performedTaskRepository.save(performedTask);
    }

    public PerformedTask createPerformedTask(PerformedTaskRequestDTO dto) {
        PerformedTask performedTask = new PerformedTask();
        return savePerformedTask(performedTask, dto);
    }

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
