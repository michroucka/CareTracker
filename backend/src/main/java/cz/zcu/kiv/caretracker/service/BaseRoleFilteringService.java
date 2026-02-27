package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.exception.ValidationException;
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
            throw new SecurityException("Uživatel není přihlášen");
        }

        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new UsernameNotFoundException("Uživatel nebyl nalezen"));
    }

    /**
     * Validuje, že uživatel má přístup k entitě na základě organizace.
     * - SUPERADMIN: Má přístup ke všemu
     * - ADMIN/COORDINATOR/CAREGIVER: Musí být ze stejné organizace
     *
     * @param entity Entity k validaci
     * @param organizationIdGetter Funkce pro získání organizationId z entity
     * @throws SecurityException Pokud uživatel nemá přístup k entitě
     */
    protected <E> void validateOrganizationAccess(E entity, Function<E, Long> organizationIdGetter) {
        if (entity == null) {
            throw new ValidationException("Entita nemůže být null");
        }

        Long entityOrgId = organizationIdGetter.apply(entity);
        if (entityOrgId == null) {
            throw new ValidationException("Entita musí mít přiřazenou organizaci");
        }

        validateOrganizationId(entityOrgId);
    }

    /**
     * Validuje, že uživatel má přístup k organizaci podle ID.
     * - SUPERADMIN: Má přístup ke všemu
     * - ADMIN/COORDINATOR/CAREGIVER: Musí být ze stejné organizace
     *
     * @param organizationId ID organizace k validaci
     * @throws SecurityException Pokud uživatel nemá přístup k této organizaci
     */
    protected void validateOrganizationId(Long organizationId) {
        if (organizationId == null) {
            throw new ValidationException("ID organizace nemůže být null");
        }

        User user = getCurrentUser();
        UserRole role = user.getRole();

        // SUPERADMIN má přístup ke všemu
        if (role == UserRole.SUPERADMIN) {
            return;
        }

        // Zaměstnanci musí mít přiřazenou organizaci
        if (user.getEmployee() == null || user.getEmployee().getOrganization() == null) {
            throw new SecurityException("Zaměstnanec nemá přiřazenou organizaci");
        }

        Long userOrgId = user.getEmployee().getOrganization().getId();

        if (!userOrgId.equals(organizationId)) {
            throw new SecurityException("Přístup odepřen: entita patří do jiné organizace");
        }
    }

    /**
     * Validuje, že uživatel má přístup k entitě na základě organizace a departmentu.
     * - SUPERADMIN: Má přístup ke všemu
     * - ADMIN: Musí být ze stejné organizace
     * - COORDINATOR/CAREGIVER: Musí být ze stejného departmentu
     *
     * @param entity Entity k validaci
     * @param organizationIdGetter Funkce pro získání organizationId z entity
     * @param departmentIdGetter Funkce pro získání departmentId z entity
     * @throws SecurityException Pokud uživatel nemá přístup k entitě
     */
    protected <E> void validateDepartmentAccess(
            E entity,
            Function<E, Long> organizationIdGetter,
            Function<E, Long> departmentIdGetter
    ) {
        if (entity == null) {
            throw new ValidationException("Entita nemůže být null");
        }

        Long entityOrgId = organizationIdGetter.apply(entity);
        Long entityDeptId = departmentIdGetter.apply(entity);

        if (entityOrgId == null) {
            throw new ValidationException("Entita musí mít přiřazenou organizaci");
        }

        validateDepartmentId(entityDeptId, entityOrgId);
    }

    /**
     * Validuje, že uživatel má přístup k departmentu podle ID.
     * - SUPERADMIN: Má přístup ke všemu
     * - ADMIN: Musí být ze stejné organizace
     * - COORDINATOR/CAREGIVER: Musí být ze stejného departmentu
     *
     * @param departmentId ID departmentu k validaci (může být null)
     * @param organizationId ID organizace departmentu
     * @throws SecurityException Pokud uživatel nemá přístup k tomuto departmentu
     */
    protected void validateDepartmentId(Long departmentId, Long organizationId) {
        if (organizationId == null) {
            throw new ValidationException("ID organizace nemůže být null");
        }

        User user = getCurrentUser();
        UserRole role = user.getRole();

        // SUPERADMIN má přístup ke všemu
        if (role == UserRole.SUPERADMIN) {
            return;
        }

        // Zaměstnanci musí mít přiřazenou organizaci
        if (user.getEmployee() == null || user.getEmployee().getOrganization() == null) {
            throw new SecurityException("Zaměstnanec nemá přiřazenou organizaci");
        }

        Long userOrgId = user.getEmployee().getOrganization().getId();

        // Kontrola organizace
        if (!userOrgId.equals(organizationId)) {
            throw new SecurityException("Přístup odepřen: entita patří do jiné organizace");
        }

        // ADMIN má přístup ke všemu v rámci organizace
        if (role == UserRole.ADMIN) {
            return;
        }

        // COORDINATOR a CAREGIVER musí být ze stejného departmentu
        if (role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
            if (user.getEmployee().getDepartment() == null) {
                throw new SecurityException("Zaměstnanec nemá přiřazené oddělení");
            }

            Long userDeptId = user.getEmployee().getDepartment().getId();

            if (departmentId == null || !userDeptId.equals(departmentId)) {
                throw new SecurityException("Přístup odepřen: entita patří do jiného oddělení");
            }
        }
    }

    /**
     * Validuje, že uživatel má oprávnění upravovat danou entitu.
     * Používá stejnou logiku jako getEntityByIdWithPermissionCheck.
     * - SUPERADMIN: Má přístup ke všemu
     * - ADMIN: Musí být ze stejné organizace
     * - COORDINATOR/CAREGIVER: Musí být ze stejného departmentu
     *
     * @param entity Entity k validaci
     * @param organizationIdGetter Funkce pro získání organizationId z entity
     * @param departmentIdGetter Funkce pro získání departmentId z entity
     * @throws SecurityException Pokud uživatel nemá oprávnění upravovat tuto entitu
     */
    protected <E> void validateUpdateAccess(
            E entity,
            Function<E, Long> organizationIdGetter,
            Function<E, Long> departmentIdGetter
    ) {
        validateDepartmentAccess(entity, organizationIdGetter, departmentIdGetter);
    }

    /**
     * Filtruje entity podle role přihlášeného uživatele a vrací je jako DTO.
     * Všichni zaměstnanci (ADMIN, COORDINATOR, CAREGIVER) mají přístup k datům celé organizace.
     * - SUPERADMIN: Vidí vše (superAdminQuery)
     * - ADMIN/COORDINATOR/CAREGIVER: Vidí data z celé organizace (organizationQuery)
     *
     * @param superAdminQuery Query pro SUPERADMIN (např. repository::findAll)
     * @param organizationQuery Query pro zaměstnance s organizationId (např. repository::findByOrganizationId)
     * @param mapper Funkce pro převod List<T> na List<D> (např. mapper::toDTOList)
     * @return Seznam DTO filtrovaných podle role
     * @throws SecurityException Pokud uživatel nemá oprávnění nebo chybí employee/organizace
     */
    protected List<D> filterEntitiesByRole(
            Supplier<List<T>> superAdminQuery,
            Function<Long, List<T>> organizationQuery,
            Function<List<T>, List<D>> mapper
    ) {
        User user = getCurrentUser();
        List<T> entities;
        UserRole role = user.getRole();

        // SUPERADMIN má přístup ke všemu
        if (role == UserRole.SUPERADMIN) {
            entities = superAdminQuery.get();
        }
        // Zaměstnanci - filtrování podle organizace
        else if (user.getEmployee() != null) {
            // ADMIN, COORDINATOR i CAREGIVER vidí data z celé organizace
            if (role == UserRole.ADMIN || role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getOrganization() == null) {
                    throw new SecurityException("Zaměstnanec nemá přiřazenou organizaci");
                }
                Long organizationId = user.getEmployee().getOrganization().getId();
                entities = organizationQuery.apply(organizationId);
            }
            else {
                throw new SecurityException("Nepovolená role zaměstnance");
            }
        }
        // CLIENT role nemá přístup
        else {
            throw new SecurityException("Nemáte oprávnění zobrazit tato data");
        }

        return mapper.apply(entities);
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
        return filterEntitiesByRole(superAdminQuery, organizationQuery, departmentQuery, mapper, null);
    }

    /**
     * Filtruje entity podle role přihlášeného uživatele a vrací je jako DTO.
     * Podporuje volitelné filtrování podle organizationId pro SUPERADMIN.
     * - SUPERADMIN: Pokud je zadán requestedOrganizationId, filtruje podle něj. Jinak vidí všechna data.
     * - ADMIN: Vidí data z celé své organizace (ignoruje requestedOrganizationId)
     * - COORDINATOR/CAREGIVER: Vidí data ze svého oddělení (ignoruje requestedOrganizationId)
     *
     * @param superAdminQuery Query pro SUPERADMIN bez filtru (např. repository::findAll)
     * @param organizationQuery Query s organizationId filtrem (např. repository::findByOrganizationId)
     * @param departmentQuery Query s departmentId filtrem (např. repository::findByDepartmentId)
     * @param mapper Funkce pro převod List<T> na List<D> (např. mapper::toDTOList)
     * @param requestedOrganizationId Volitelné ID organizace pro filtrování (pouze pro SUPERADMIN)
     * @return Seznam DTO filtrovaných podle role a případně organizationId
     * @throws SecurityException Pokud uživatel nemá oprávnění nebo chybí employee/organizace/oddělení
     */
    protected List<D> filterEntitiesByRole(
            Supplier<List<T>> superAdminQuery,
            Function<Long, List<T>> organizationQuery,
            Function<Long, List<T>> departmentQuery,
            Function<List<T>, List<D>> mapper,
            Long requestedOrganizationId
    ) {
        User user = getCurrentUser();
        List<T> entities;
        UserRole role = user.getRole();

        // SUPERADMIN má přístup ke všemu
        if (role == UserRole.SUPERADMIN) {
            if (requestedOrganizationId != null) {
                // Filtrovat podle zadané organizace
                entities = organizationQuery.apply(requestedOrganizationId);
            } else {
                // Vrátit všechna data
                entities = superAdminQuery.get();
            }
        }
        // Zaměstnanci - filtrování podle organizace/oddělení
        else if (user.getEmployee() != null) {
            // ADMIN vidí data z celé organizace (ignoruje requestedOrganizationId)
            if (role == UserRole.ADMIN) {
                if (user.getEmployee().getOrganization() == null) {
                    throw new SecurityException("Administrátor nemá přiřazenou organizaci");
                }
                Long organizationId = user.getEmployee().getOrganization().getId();
                entities = organizationQuery.apply(organizationId);
            }
            // COORDINATOR a CAREGIVER vidí pouze data ze svého oddělení (ignoruje requestedOrganizationId)
            else if (role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getDepartment() == null) {
                    throw new SecurityException("Zaměstnanec nemá přiřazené oddělení");
                }
                Long departmentId = user.getEmployee().getDepartment().getId();
                entities = departmentQuery.apply(departmentId);
            }
            else {
                throw new SecurityException("Nepovolená role zaměstnance");
            }
        }
        // CLIENT role nemá přístup
        else {
            throw new SecurityException("Nemáte oprávnění zobrazit tato data");
        }

        return mapper.apply(entities);
    }

    /**
     * Vrací jednotlivou entitu podle ID s kontrolou oprávnění.
     * Všichni zaměstnanci (ADMIN, COORDINATOR, CAREGIVER) mají přístup k datům celé organizace.
     *
     * @param id ID entity
     * @param entityFinder Funkce pro nalezení entity (např. () -> repository.findById(id))
     * @param organizationIdGetter Funkce pro získání organizationId z entity (např. entity -> entity.getOrganization().getId())
     * @param mapper Funkce pro převod entity na DTO (např. mapper::toDTO)
     * @return Optional s DTO entity, pokud má uživatel oprávnění a entita existuje
     * @throws SecurityException Pokud uživatel nemá oprávnění k této entitě
     */
    protected Optional<D> getEntityByIdWithPermissionCheck(
            Long id,
            Supplier<Optional<T>> entityFinder,
            Function<T, Long> organizationIdGetter,
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

        // Zaměstnanci - kontrola přístupu podle organizace
        if (user.getEmployee() != null) {
            // ADMIN, COORDINATOR i CAREGIVER mohou vidět entity z celé organizace
            if (role == UserRole.ADMIN || role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getOrganization() == null) {
                    throw new SecurityException("Zaměstnanec nemá přiřazenou organizaci");
                }

                Long userOrgId = user.getEmployee().getOrganization().getId();
                Long entityOrgId = organizationIdGetter.apply(entity);

                if (userOrgId.equals(entityOrgId)) {
                    return Optional.of(mapper.apply(entity));
                } else {
                    throw new SecurityException("Přístup odepřen: entita patří do jiné organizace");
                }
            }
        }

        throw new SecurityException("Nemáte oprávnění zobrazit tuto entitu");
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
                    throw new SecurityException("Administrátor nemá přiřazenou organizaci");
                }

                Long userOrgId = user.getEmployee().getOrganization().getId();
                Long entityOrgId = organizationIdGetter.apply(entity);

                if (userOrgId.equals(entityOrgId)) {
                    return Optional.of(mapper.apply(entity));
                } else {
                    throw new SecurityException("Přístup odepřen: entita patří do jiné organizace");
                }
            }

            // COORDINATOR a CAREGIVER mohou vidět pouze entity ze svého oddělení
            if (role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getDepartment() == null) {
                    throw new SecurityException("Zaměstnanec nemá přiřazené oddělení");
                }

                Long userDeptId = user.getEmployee().getDepartment().getId();
                Long entityDeptId = departmentIdGetter.apply(entity);

                if (userDeptId.equals(entityDeptId)) {
                    return Optional.of(mapper.apply(entity));
                } else {
                    throw new SecurityException("Přístup odepřen: entita patří do jiného oddělení");
                }
            }
        }

        throw new SecurityException("Nemáte oprávnění zobrazit tuto entitu");
    }

    /**
     * Vypočítá filtry pro organizaci a oddělení podle role přihlášeného uživatele.
     * Slouží pro použití s JPA Specifications nebo vlastními queries.
     *
     * Role-based logika:
     * - SUPERADMIN: Může použít requestedOrganizationId (nebo null pro všechny organizace)
     *               a requestedDepartmentIds jak jsou zadány
     * - ADMIN: Vidí jen svou organizaci, může filtrovat podle requestedDepartmentIds
     * - COORDINATOR/CAREGIVER: Vidí jen své oddělení, requestedDepartmentIds se ignorují
     *                          (nebo se zkontroluje, že obsahují pouze jejich oddělení)
     *
     * @param requestedOrganizationId ID organizace z request parametru (může být null)
     * @param requestedDepartmentIds Seznam ID oddělení z request parametru (může být null nebo prázdný)
     * @return RoleBasedFilters s vypočítanými hodnotami podle role
     * @throws SecurityException Pokud uživatel nemá oprávnění nebo chybí employee/organizace/oddělení
     */
    protected RoleBasedFilters calculateRoleBasedFilters(
            Long requestedOrganizationId,
            List<Long> requestedDepartmentIds
    ) {
        User user = getCurrentUser();
        UserRole role = user.getRole();

        if (role == UserRole.SUPERADMIN) {
            // SUPERADMIN může používat parametry jak jsou
            return new RoleBasedFilters(requestedOrganizationId, requestedDepartmentIds);

        } else if (role == UserRole.ADMIN) {
            // ADMIN vidí jen svou organizaci
            if (user.getEmployee() == null || user.getEmployee().getOrganization() == null) {
                throw new SecurityException("Administrátor nemá přiřazenou organizaci");
            }
            Long userOrgId = user.getEmployee().getOrganization().getId();

            // Může filtrovat podle departmentIds v rámci své organizace
            return new RoleBasedFilters(userOrgId, requestedDepartmentIds);

        } else if (role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
            // COORDINATOR/CAREGIVER vidí jen své oddělení
            if (user.getEmployee() == null || user.getEmployee().getDepartment() == null) {
                throw new SecurityException("Zaměstnanec nemá přiřazené oddělení");
            }

            Long userOrgId = user.getEmployee().getOrganization().getId();
            Long userDeptId = user.getEmployee().getDepartment().getId();

            // Pokud uživatel zadal departmentIds, zkontroluj přístup
            if (requestedDepartmentIds != null && !requestedDepartmentIds.isEmpty()) {
                // Pokud požaduje oddělení, ke kterým nemá přístup, vrať noAccess
                if (!requestedDepartmentIds.contains(userDeptId)) {
                    return RoleBasedFilters.noAccess();
                }
            }

            // Vždy filtruj podle jeho oddělení
            return new RoleBasedFilters(userOrgId, java.util.Collections.singletonList(userDeptId));

        } else {
            throw new SecurityException("Nemáte oprávnění zobrazit tato data");
        }
    }

    /**
     * Vypočítá filtry pro organizaci podle role přihlášeného uživatele.
     * Verze bez filtrování podle oddělení.
     *
     * Role-based logika:
     * - SUPERADMIN: Může použít requestedOrganizationId (nebo null pro všechny organizace)
     * - ADMIN/COORDINATOR/CAREGIVER: Vidí jen svou organizaci
     *
     * @param requestedOrganizationId ID organizace z request parametru (může být null)
     * @return RoleBasedFilters s vypočítanou hodnotou organizationId podle role
     * @throws SecurityException Pokud uživatel nemá oprávnění nebo chybí employee/organizace
     */
    protected RoleBasedFilters calculateRoleBasedFiltersOrganizationOnly(Long requestedOrganizationId) {
        User user = getCurrentUser();
        UserRole role = user.getRole();

        if (role == UserRole.SUPERADMIN) {
            // SUPERADMIN může používat parametr jak je
            return new RoleBasedFilters(requestedOrganizationId, null);

        } else if (role == UserRole.ADMIN || role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
            // Všichni zaměstnanci vidí jen svou organizaci
            if (user.getEmployee() == null || user.getEmployee().getOrganization() == null) {
                throw new SecurityException("Zaměstnanec nemá přiřazenou organizaci");
            }
            Long userOrgId = user.getEmployee().getOrganization().getId();

            return new RoleBasedFilters(userOrgId, null);

        } else {
            throw new SecurityException("Nemáte oprávnění zobrazit tato data");
        }
    }
}
