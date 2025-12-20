package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
}
