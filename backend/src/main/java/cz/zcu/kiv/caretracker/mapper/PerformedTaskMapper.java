package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.PerformedTaskDTO;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PerformedTaskMapper {
    @Autowired
    ClientMapper clientMapper;
    @Autowired
    TaskMapper taskMapper;
    @Autowired
    DepartmentMapper departmentMapper;
    @Autowired
    EmployeeMapper employeeMapper;

    public PerformedTaskDTO toDTO(PerformedTask pt) {
        if (pt == null) {
            return null;
        }

        PerformedTaskDTO dto = new PerformedTaskDTO();

        dto.setId(pt.getId());
        dto.setDate(pt.getDate());
        dto.setUnitCount(pt.getUnitCount());
        dto.setNotes(pt.getNotes());

        dto.setClient(clientMapper.toDTO(pt.getClient()));
        dto.setTask(taskMapper.toDTO(pt.getTask()));
        dto.setDepartment(departmentMapper.toDTO(pt.getDepartment()));
        dto.setCaregivers(employeeMapper.toDTOList(pt.getCaregivers()));

        return dto;
    }


    public List<PerformedTaskDTO> toDTOList(List<PerformedTask> performedTasks) {
        if (performedTasks == null) {
            return null;
        }

        return performedTasks.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}
