package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Client;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long>, JpaSpecificationExecutor<Client> {
    // the accounts (user side of a one-to-one) of clients and caregivers are loaded eagerly one row at a time,
    // batch fetching does not cover them
    @Override
    @EntityGraph(attributePaths = {"user", "department", "caregiver", "caregiver.user"})
    List<Client> findAll(Specification<Client> spec);

    List<Client> findByActiveTrue();

    List<Client> findByDepartmentId(Long departmentId);

    List<Client> findByOrganizationId(Long organizationId);

    boolean existsByPersonalNumberAndOrganizationIdAndActiveTrue(Long personalNumber, Long organizationId);
    boolean existsByPersonalNumber(Long personalNumber);
    boolean existsByDepartmentIdAndActiveTrue(Long departmentId);
    long countByActiveTrueAndCaregiverId(Long caregiverId);
    long countByActiveTrueAndDepartmentId(Long departmentId);
    long countByActiveTrueAndOrganizationId(Long organizationId);
    long countByActiveTrue();

    /**
     * Returns rows of [clientId, full name, latest task date, number of all matching clients] for active clients
     * created before {@code since} whose latest performed task (if any) is older than {@code since},
     * clients without any record first, then the longest without one. Only the first {@code limit} rows are returned,
     * the last column counts all of them. Each scope parameter is optional (null = no restriction).
     */
    @Query(value = """
            SELECT c.id, CONCAT_WS(' ', c.first_name, c.last_name), MAX(pt.date) AS last_record, COUNT(*) OVER ()
            FROM client c
            LEFT JOIN performed_task pt ON pt.client_id = c.id
            WHERE c.active = true
              AND (c.created IS NULL OR c.created < :since)
              AND (CAST(:organizationId AS bigint) IS NULL OR c.organization_id = :organizationId)
              AND (CAST(:departmentId AS bigint) IS NULL OR c.department_id = :departmentId)
              AND (CAST(:caregiverId AS bigint) IS NULL OR c.caregiver_id = :caregiverId)
            GROUP BY c.id
            HAVING MAX(pt.date) IS NULL OR MAX(pt.date) < :since
            ORDER BY last_record NULLS FIRST, c.id
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findWithoutRecordsSince(@Param("since") LocalDate since, @Param("limit") int limit,
                                           @Param("organizationId") Long organizationId,
                                           @Param("departmentId") Long departmentId,
                                           @Param("caregiverId") Long caregiverId);
}
