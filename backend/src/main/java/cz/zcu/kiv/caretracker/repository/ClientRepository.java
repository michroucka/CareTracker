package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long>, JpaSpecificationExecutor<Client> {
    List<Client> findByActiveTrue();

    List<Client> findByActiveTrueAndDepartmentId(Long departmentId);
    List<Client> findByDepartmentId(Long departmentId);

    List<Client> findByActiveTrueAndOrganizationId(Long organizationId);
    List<Client> findByOrganizationId(Long organizationId);

    boolean existsByPersonalNumberAndOrganizationIdAndActiveTrue(Long personalNumber, Long organizationId);
    boolean existsByPersonalNumber(Long personalNumber);
    boolean existsByDepartmentIdAndActiveTrue(Long departmentId);
    long countByActiveTrueAndCaregiverId(Long caregiverId);
    long countByActiveTrueAndDepartmentId(Long departmentId);
    long countByActiveTrueAndOrganizationId(Long organizationId);
}
