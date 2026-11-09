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

    /** Returns rows of [clientId, latest task date] for the given clients. */
    @Query("SELECT pt.client.id, MAX(pt.date) FROM PerformedTask pt WHERE pt.client.id IN :clientIds GROUP BY pt.client.id")
    List<Object[]> findLastRecordDatesByClientIds(@Param("clientIds") Collection<Long> clientIds);

    /** Returns rows of [organizationId, latest task date] for all organizations. */
    @Query("SELECT pt.organization.id, MAX(pt.date) FROM PerformedTask pt GROUP BY pt.organization.id")
    List<Object[]> findLastActivityByOrganization();

    /*
     * Dashboard aggregates. Price per task is rounded like PerformedTask#calculatePrice
     * (HOUR tasks are stored in minutes), then summed.
     */

    /**
     * Returns rows of [year, month, task count, income] for tasks in [start, end).
     * Each scope parameter is optional (null = no restriction), all null = whole application.
     */
    @Query(value = """
            SELECT EXTRACT(YEAR FROM pt.date) AS year, EXTRACT(MONTH FROM pt.date) AS month,
                   COUNT(*) AS task_count,
                   COALESCE(SUM(ROUND(CASE WHEN t.unit_type = 'HOUR' THEN pt.unit_count * t.unit_price / 60.0 ELSE pt.unit_count * t.unit_price END)), 0) AS income
            FROM performed_task pt
            JOIN task t ON t.id = pt.task_id
            WHERE pt.date >= :start AND pt.date < :end
              AND (CAST(:organizationId AS bigint) IS NULL OR pt.organization_id = :organizationId)
              AND (CAST(:departmentId AS bigint) IS NULL OR pt.department_id = :departmentId)
              AND (CAST(:caregiverId AS bigint) IS NULL OR EXISTS (
                    SELECT 1 FROM caregiver_performed_task cpt
                    WHERE cpt.performed_task_id = pt.id AND cpt.caregiver_id = :caregiverId))
            GROUP BY 1, 2
            """, nativeQuery = true)
    List<Object[]> sumByMonth(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
                              @Param("organizationId") Long organizationId,
                              @Param("departmentId") Long departmentId,
                              @Param("caregiverId") Long caregiverId);

    /** Returns rows of [caregiverId, task count, minutes of HOUR tasks] for one department in [start, end). */
    @Query(value = """
            SELECT cpt.caregiver_id, COUNT(*) AS task_count,
                   COALESCE(SUM(CASE WHEN t.unit_type = 'HOUR' THEN pt.unit_count ELSE 0 END), 0) AS minutes
            FROM caregiver_performed_task cpt
            JOIN performed_task pt ON pt.id = cpt.performed_task_id
            JOIN task t ON t.id = pt.task_id
            WHERE pt.department_id = :departmentId AND pt.date >= :start AND pt.date < :end
            GROUP BY cpt.caregiver_id
            """, nativeQuery = true)
    List<Object[]> sumByCaregiver(@Param("departmentId") Long departmentId,
                                  @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /** Returns rows of [department name, task count, income] for one organization in [start, end). */
    @Query(value = """
            SELECT d.city, COUNT(*) AS task_count, COALESCE(SUM(ROUND(CASE WHEN t.unit_type = 'HOUR' THEN pt.unit_count * t.unit_price / 60.0 ELSE pt.unit_count * t.unit_price END)), 0) AS income
            FROM performed_task pt
            JOIN task t ON t.id = pt.task_id
            JOIN department d ON d.id = pt.department_id
            WHERE pt.organization_id = :organizationId AND pt.date >= :start AND pt.date < :end
            GROUP BY d.id, d.city
            """, nativeQuery = true)
    List<Object[]> sumByDepartment(@Param("organizationId") Long organizationId,
                                   @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /** Returns rows of [organizationId, task count] in [start, end). */
    @Query(value = """
            SELECT pt.organization_id, COUNT(*) FROM performed_task pt
            WHERE pt.date >= :start AND pt.date < :end
            GROUP BY pt.organization_id
            """, nativeQuery = true)
    List<Object[]> countByOrganization(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
