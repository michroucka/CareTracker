package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.PerformedTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformedTaskRepository extends JpaRepository<PerformedTask, Long>, JpaSpecificationExecutor<PerformedTask> {
    List<PerformedTask> findByOrganizationId(Long organizationId);
    List<PerformedTask> findByDepartmentId(Long departmentId);
}
