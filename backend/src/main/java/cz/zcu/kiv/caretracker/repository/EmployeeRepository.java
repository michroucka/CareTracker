package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByOrganizationId(Long organizationId);
    List<Employee> findByDepartmentId(Long departmentId);
}
