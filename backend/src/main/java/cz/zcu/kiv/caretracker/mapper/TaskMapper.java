package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.task.TaskDTO;
import cz.zcu.kiv.caretracker.dto.task.TaskRequestDTO;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.enums.UnitType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class TaskMapper {
    public TaskDTO toDTO(Task task) {
        if (task == null) {
            return null;
        }

        TaskDTO dto = new TaskDTO();

        dto.setId(task.getId());
        dto.setName(task.getName());
        dto.setUnitPrice(task.getUnitPrice());
        dto.setUnitType(task.getUnitType().name());
        dto.setDoubleMeeting(task.getDoubleMeeting());
        dto.setActive(task.getActive());

        return dto;
    }

    public void requestToTask(Task task, TaskRequestDTO dto, Organization organization) {
        task.setName(dto.getName());
        task.setUnitPrice(dto.getUnitPrice());
        task.setUnitType(UnitType.valueOf(dto.getUnitType()));
        task.setDoubleMeeting(dto.getDoubleMeeting());

        task.setOrganization(organization);
    }

    public List<TaskDTO> toDTOList(List<Task> tasks) {
        if (tasks == null) {
            return null;
        }

        return tasks.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}
