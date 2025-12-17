package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Supplier;

/**
 * Abstraktní service třída poskytující společnou funkcionalitu pro filtrování dat podle role uživatele.
 * Eliminuje duplikaci kódu napříč service vrstvou.
 *
 * @param <T> Typ entity
 * @param <D> Typ DTO
 */
public abstract class BaseRoleFilteringService<T, D> {

    @Autowired
    protected UserRepository userRepository;

    /**
     * Vrací aktuálně přihlášeného uživatele.
     *
     * @return Přihlášený uživatel
     * @throws SecurityException Pokud uživatel není autentizován
     * @throws UsernameNotFoundException Pokud uživatel nebyl nalezen v databázi
     */
    protected User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new SecurityException("User is not authenticated");
        }

        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    /**
     * Filtruje entity podle role přihlášeného uživatele a vrací je jako DTO.
     * - SUPERADMIN: Vidí vše (superAdminQuery)
     * - ADMIN: Vidí data z celé organizace (organizationQuery)
     * - COORDINATOR/CAREGIVER: Vidí data z oddělení (departmentQuery)
     *
     * @param superAdminQuery Query pro SUPERADMIN (např. repository::findAll)
     * @param organizationQuery Query pro ADMIN s organizationId (např. repository::findByOrganizationId)
     * @param departmentQuery Query pro COORDINATOR/CAREGIVER s departmentId (např. repository::findByDepartmentId)
     * @param mapper Funkce pro převod List<T> na List<D> (např. mapper::toDTOList)
     * @return Seznam DTO filtrovaných podle role
     * @throws SecurityException Pokud uživatel nemá oprávnění nebo chybí employee/organizace/oddělení
     */
    protected List<D> filterEntitiesByRole(
            Supplier<List<T>> superAdminQuery,
            Function<Long, List<T>> organizationQuery,
            Function<Long, List<T>> departmentQuery,
            Function<List<T>, List<D>> mapper
    ) {
        User user = getCurrentUser();
        List<T> entities;
        UserRole role = user.getRole();

        // SUPERADMIN má přístup ke všemu
        if (role == UserRole.SUPERADMIN) {
            entities = superAdminQuery.get();
        }
        // Zaměstnanci - filtrování podle organizace/oddělení
        else if (user.getEmployee() != null) {
            // ADMIN vidí data z celé organizace
            if (role == UserRole.ADMIN) {
                if (user.getEmployee().getOrganization() == null) {
                    throw new SecurityException("Admin must have an associated organization");
                }
                Long organizationId = user.getEmployee().getOrganization().getId();
                entities = organizationQuery.apply(organizationId);
            }
            // COORDINATOR a CAREGIVER vidí pouze data ze svého oddělení
            else if (role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getDepartment() == null) {
                    throw new SecurityException("Employee must have an associated department");
                }
                Long departmentId = user.getEmployee().getDepartment().getId();
                entities = departmentQuery.apply(departmentId);
            }
            else {
                throw new SecurityException("Unauthorized employee role");
            }
        }
        // CLIENT role nemá přístup
        else {
            throw new SecurityException("User does not have permission to view this data");
        }

        return mapper.apply(entities);
    }

    /**
     * Vrací jednotlivou entitu podle ID s kontrolou oprávnění.
     * Kontroluje, zda má uživatel přístup k této konkrétní entitě podle své role a organizace/oddělení.
     *
     * @param id ID entity
     * @param entityFinder Funkce pro nalezení entity (např. () -> repository.findById(id))
     * @param organizationIdGetter Funkce pro získání organizationId z entity (např. entity -> entity.getOrganization().getId())
     * @param departmentIdGetter Funkce pro získání departmentId z entity (např. entity -> entity.getDepartment().getId())
     * @param mapper Funkce pro převod entity na DTO (např. mapper::toDTO)
     * @return Optional s DTO entity, pokud má uživatel oprávnění a entita existuje
     * @throws SecurityException Pokud uživatel nemá oprávnění k této entitě
     */
    protected Optional<D> getEntityByIdWithPermissionCheck(
            Long id,
            Supplier<Optional<T>> entityFinder,
            Function<T, Long> organizationIdGetter,
            Function<T, Long> departmentIdGetter,
            Function<T, D> mapper
    ) {
        User user = getCurrentUser();
        Optional<T> entityOpt = entityFinder.get();

        if (entityOpt.isEmpty()) {
            return Optional.empty();
        }

        T entity = entityOpt.get();
        UserRole role = user.getRole();

        // SUPERADMIN má přístup ke všemu
        if (role == UserRole.SUPERADMIN) {
            return Optional.of(mapper.apply(entity));
        }

        // Zaměstnanci - kontrola přístupu podle organizace/oddělení
        if (user.getEmployee() != null) {
            // ADMIN může vidět entity z celé organizace
            if (role == UserRole.ADMIN) {
                if (user.getEmployee().getOrganization() == null) {
                    throw new SecurityException("Admin must have an associated organization");
                }

                Long userOrgId = user.getEmployee().getOrganization().getId();
                Long entityOrgId = organizationIdGetter.apply(entity);

                if (userOrgId.equals(entityOrgId)) {
                    return Optional.of(mapper.apply(entity));
                } else {
                    throw new SecurityException("Access denied: Entity is from a different organization");
                }
            }

            // COORDINATOR a CAREGIVER mohou vidět pouze entity ze svého oddělení
            if (role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getDepartment() == null) {
                    throw new SecurityException("Employee must have an associated department");
                }

                Long userDeptId = user.getEmployee().getDepartment().getId();
                Long entityDeptId = departmentIdGetter.apply(entity);

                if (userDeptId.equals(entityDeptId)) {
                    return Optional.of(mapper.apply(entity));
                } else {
                    throw new SecurityException("Access denied: Entity is from a different department");
                }
            }
        }

        throw new SecurityException("User does not have permission to view this entity");
    }
}
