package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.IndividualPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface IndividualPlanRepository extends JpaRepository<IndividualPlan, Long> {
    Optional<IndividualPlan> findByClientId(Long clientId);

    Optional<IndividualPlan> findByClientIdAndOrganizationId(Long clientId, Long organizationId);

    @Query("SELECT ip FROM IndividualPlan ip WHERE ip.client.department.id = :departmentId AND ip.currentContent IS NOT NULL AND ip.client.active = true AND ip.currentContent.plannedUpdateDate <= :end ORDER BY ip.currentContent.plannedUpdateDate ASC")
    List<IndividualPlan> findUpcomingUpdatesByDepartment(@Param("departmentId") Long departmentId, @Param("end") LocalDate end);

    @Query("SELECT ip FROM IndividualPlan ip WHERE ip.client.caregiver.id = :caregiverId AND ip.currentContent IS NOT NULL AND ip.client.active = true AND ip.currentContent.plannedUpdateDate <= :end ORDER BY ip.currentContent.plannedUpdateDate ASC")
    List<IndividualPlan> findUpcomingUpdatesByCaregiver(@Param("caregiverId") Long caregiverId, @Param("end") LocalDate end);

}
