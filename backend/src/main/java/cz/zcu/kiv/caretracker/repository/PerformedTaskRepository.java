package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.PerformedTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.Collection;
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

    List<PerformedTask> findByDateBetween(LocalDateTime start, LocalDateTime end);

    /** Returns rows of [clientId, latest task date] for the given clients. */
    @Query("SELECT pt.client.id, MAX(pt.date) FROM PerformedTask pt WHERE pt.client.id IN :clientIds GROUP BY pt.client.id")
    List<Object[]> findLastRecordDatesByClientIds(@Param("clientIds") Collection<Long> clientIds);

    /** Returns rows of [organizationId, latest task date] for all organizations. */
    @Query("SELECT pt.organization.id, MAX(pt.date) FROM PerformedTask pt GROUP BY pt.organization.id")
    List<Object[]> findLastActivityByOrganization();
}
