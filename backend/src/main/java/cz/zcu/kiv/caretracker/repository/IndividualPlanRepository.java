package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.IndividualPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IndividualPlanRepository extends JpaRepository<IndividualPlan, Long> {
    Optional<IndividualPlan> findByClientId(Long clientId);

    Optional<IndividualPlan> findByClientIdAndOrganizationId(Long clientId, Long organizationId);
}
