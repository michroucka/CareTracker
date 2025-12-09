package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findByActiveTrue();

    // Filtrování podle oddělení (pro CAREGIVER a COORDINATOR)
    List<Client> findByActiveTrueAndDepartmentId(Long departmentId);

    // Filtrování podle organizace (pro ADMIN)
    @Query("SELECT c FROM Client c WHERE c.active = true AND c.department.organization.id = :organizationId")
    List<Client> findByActiveTrueAndOrganizationId(@Param("organizationId") Long organizationId);
}
