package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.TaskDTO;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.mapper.TaskMapper;
import cz.zcu.kiv.caretracker.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskService extends BaseRoleFilteringService<Task, TaskDTO> {
    @Autowired
    TaskRepository taskRepository;
    @Autowired
    TaskMapper taskMapper;

    @Transactional(readOnly = true)
    public List<TaskDTO> getAllTasks() {
        return filterEntitiesByRole(
                taskRepository::findAll,
                taskRepository::findByOrganizationId,
                taskRepository::findByOrganizationId, // Tasks jsou filtrované pouze podle organizace, ne oddělení
                taskMapper::toDTOList
        );
    }
}
