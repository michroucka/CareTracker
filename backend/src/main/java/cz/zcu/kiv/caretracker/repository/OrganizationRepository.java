package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    List<Organization> findByActive(boolean active);
    Optional<Organization> findByIdAndActive(Long id, boolean active);
}
