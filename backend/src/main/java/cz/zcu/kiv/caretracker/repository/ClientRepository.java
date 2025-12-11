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
    List<Client> findByDepartmentId(Long departmentId);

    // Filtrování podle organizace (pro ADMIN)
    List<Client> findByActiveTrueAndOrganizationId(Long organizationId);
    List<Client> findByOrganizationId(Long organizationId);

    // Kontrola existence personalNumber v rámci organizace (pouze aktivní klienti)
    boolean existsByPersonalNumberAndOrganizationIdAndActiveTrue(Long personalNumber, Long organizationId);

    // Globální kontrola existence personalNumber (pro fallback)
    boolean existsByPersonalNumber(Long personalNumber);
}
