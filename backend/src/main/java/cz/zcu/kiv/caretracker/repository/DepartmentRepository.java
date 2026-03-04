package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByOrganizationId(Long organizationId);
    List<Department> findByActiveTrueAndOrganizationId(Long organizationId);
    List<Department> findByActiveFalseAndOrganizationId(Long organizationId);
}
