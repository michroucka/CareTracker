package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.PerformedTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PerformedTaskRepository extends JpaRepository<PerformedTask, Long>, JpaSpecificationExecutor<PerformedTask> {
    List<PerformedTask> findByOrganizationId(Long organizationId);
    List<PerformedTask> findByDepartmentId(Long departmentId);

    List<PerformedTask> findByOrganizationIdAndDateBetween(Long organizationId, LocalDateTime start, LocalDateTime end);
    List<PerformedTask> findByDepartmentIdAndDateBetween(Long departmentId, LocalDateTime start, LocalDateTime end);
    List<PerformedTask> findByCaregivers_IdAndDateBetween(Long caregiverId, LocalDateTime start, LocalDateTime end);

    List<PerformedTask> findTop5ByOrganizationIdOrderByDateDesc(Long organizationId);
    List<PerformedTask> findTop5ByDepartmentIdOrderByDateDesc(Long departmentId);
    List<PerformedTask> findTop5ByCaregivers_IdOrderByDateDesc(Long caregiverId);
}
