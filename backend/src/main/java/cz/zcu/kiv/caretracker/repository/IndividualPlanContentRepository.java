package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.IndividualPlanContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface IndividualPlanContentRepository extends JpaRepository<IndividualPlanContent, Long> {
    List<IndividualPlanContent> findByIndividualPlanIdOrderByVersionNumberDesc(Long individualPlanId);

    Optional<IndividualPlanContent> findByIndividualPlanIdAndVersionNumber(Long individualPlanId, Integer versionNumber);

    Optional<IndividualPlanContent> findFirstByIndividualPlanIdOrderByVersionNumberDesc(Long individualPlanId);
}
