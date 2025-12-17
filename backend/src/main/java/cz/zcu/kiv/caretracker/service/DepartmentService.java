package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.DepartmentDTO;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.mapper.DepartmentMapper;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentService extends BaseRoleFilteringService<Department, DepartmentDTO> {
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private DepartmentMapper departmentMapper;

    public List<DepartmentDTO> getAllDepartments() {
        return filterEntitiesByRole(
                departmentRepository::findAll,
                departmentRepository::findByOrganizationId,
                deptId -> departmentRepository.findById(deptId)
                        .map(List::of)
                        .orElse(List.of()),
                departmentMapper::toDTOList
        );
    }
}
