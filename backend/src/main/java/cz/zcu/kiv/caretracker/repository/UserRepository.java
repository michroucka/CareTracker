package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);
    Optional<User> findByActivationToken(String activationToken);
    Optional<User> findByClientId(Long clientId);
    List<User> findByEmployee_OrganizationId(Long organizationId);
    List<User> findByClient_OrganizationId(Long organizationId);

    long countByRoleAndActiveTrue(UserRole role);

    /** Accounts created by an admin whose owner has not set a password yet. */
    long countByActivationTokenIsNotNullAndPasswordIsNull();

    long countByActivationTokenIsNotNullAndPasswordIsNullAndTokenExpiryBefore(LocalDateTime now);
}
