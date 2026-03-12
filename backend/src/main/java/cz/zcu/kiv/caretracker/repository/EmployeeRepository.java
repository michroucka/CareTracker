package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {
    List<Employee> findByActiveTrue();
    List<Employee> findByOrganizationId(Long organizationId);
    List<Employee> findByActiveTrueAndOrganizationId(Long organizationId);
    List<Employee> findByDepartmentId(Long departmentId);
    List<Employee> findByActiveTrueAndDepartmentId(Long departmentId);
    boolean existsByDepartmentIdAndActiveTrue(Long departmentId);
    long countByActiveTrueAndOrganizationId(Long organizationId);
}
