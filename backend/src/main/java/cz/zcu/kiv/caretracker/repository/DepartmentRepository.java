package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
}
