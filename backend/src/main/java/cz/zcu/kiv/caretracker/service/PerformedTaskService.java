package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.performedTask.PerformedTaskDTO;
import cz.zcu.kiv.caretracker.dto.performedTask.PerformedTaskRequestDTO;
import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.mapper.PerformedTaskMapper;
import cz.zcu.kiv.caretracker.repository.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

    @Transactional(readOnly = true)
    public List<PerformedTaskDTO> getAllPerformedTasks() {
        return filterEntitiesByRole(
                performedTaskRepository::findAll,
                performedTaskRepository::findByOrganizationId,
                performedTaskRepository::findByDepartmentId,
                performedTaskMapper::toDTOList
        );
    }

    @Transactional(readOnly = true)
    public Optional<PerformedTaskDTO> getPerformedTaskById(Long id) {
        return getEntityByIdWithPermissionCheck(
                id,
                () -> performedTaskRepository.findById(id),
                performedTask -> performedTask.getOrganization().getId(),
                performedTask -> performedTask.getDepartment().getId(),
                performedTaskMapper::toDTO
        );
    }

    private PerformedTask savePerformedTask(PerformedTask performedTask, PerformedTaskRequestDTO dto) {
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));
        Task task = taskRepository.findById(dto.getTaskId())
                .orElseThrow(() -> new RuntimeException("Task not found"));
        List<Employee> caregivers = new ArrayList<>();
        for (Long employeeId : dto.getCaregiverIds()) {
            Employee caregiver = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));

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
                .orElseThrow(() -> new RuntimeException("Performed task not found"));

        // Validace oprávnění
        validateUpdateAccess(
                task,
                pt -> pt.getOrganization().getId(),
                pt -> pt.getDepartment() != null ? pt.getDepartment().getId() : null
        );

        return savePerformedTask(task, dto);
    }

    public void deletePerformedTask(Long id) {
        PerformedTask task = performedTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Performed task not found"));

        // Validace oprávnění
        validateUpdateAccess(
                task,
                pt -> pt.getOrganization().getId(),
                pt -> pt.getDepartment() != null ? pt.getDepartment().getId() : null
        );

        performedTaskRepository.delete(task);
    }
}
