package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    List<Organization> findByActive(boolean active);
    Optional<Organization> findByIdAndActive(Long id, boolean active);

    /** Returns rows of [organizationId, name, active departments, active employees, active clients] for active organizations. */
    @Query("""
            SELECT o.id, o.name,
                   (SELECT COUNT(d) FROM Department d WHERE d.organization = o AND d.active = true),
                   (SELECT COUNT(e) FROM Employee e WHERE e.organization = o AND e.active = true),
                   (SELECT COUNT(c) FROM Client c WHERE c.organization = o AND c.active = true)
            FROM Organization o
            WHERE o.active = true
            """)
    List<Object[]> countActiveMembersByOrganization();
}
